import Array "mo:core/Array";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import FileStorage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Principal "mo:core/Principal";
import List "mo:core/List";


import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Add migration function to actor using "with"


actor {
  public type Resume = {
    id : Text;
    owner : Principal;
    file : FileStorage.ExternalBlob;
    uploadedAt : Time.Time;
    parsedContent : Text;
    qualityScore : ?Nat;
    improvementSuggestions : ?Text;
    targetRole : Text;
    verified : Bool;
    improvementDetails : ?[ImprovementSuggestion];
    suggestedRole : ?Text;
  };

  public type ImprovementSuggestion = {
    title : Text;
    description : Text;
    priority : Nat;
    implementationTips : [Text];
  };

  public type InterviewQuestion = {
    question : Text;
    answer : Text;
    feedback : Text;
    difficulty : Text;
    interviewType : Text;
    role : Text;
  };

  public type InterviewSession = {
    id : Text;
    user : Principal;
    role : Text;
    interviewType : Text;
    difficulty : Text;
    questions : [InterviewQuestion];
    startTime : Time.Time;
    endTime : ?Time.Time;
    overallFeedback : Text;
    roleSpecificRounds : ?[Text];
    numberOfQuestions : Nat;
  };

  public type LiveMockInterviewData = {
    id : Text;
    user : Principal;
    sessionId : Text;
    videoFile : FileStorage.ExternalBlob;
    bodyLanguageScore : Nat;
    eyeContactScore : Nat;
    facialExpressionScore : Nat;
    confidenceScore : Nat;
    attentivenessScore : Nat;
    clarityScore : Nat;
    toneScore : ?Nat;
    stylingScore : ?Nat;
    appearanceFeedback : ?Text;
    feedback : Text;
    spokenAnswerFeedback : ?SpokenAnswerFeedback;
    recordedAt : Time.Time;
    numberOfQuestions : Nat;
    sessionStarted : Bool; // Indicates if the live mock interview session has started
  };

  public type SpokenAnswerFeedback = {
    transcript : Text;
    correctnessRating : Nat;
    suggestedImprovements : Text;
    recommendedAnswer : Text;
  };

  public type UserProfile = {
    id : Principal;
    fullName : Text;
    email : Text;
    currentRole : Text;
    experienceLevel : Text;
    preferredInterviewType : Text;
    preferredDifficulty : Text;
    profilePicture : ?FileStorage.ExternalBlob;
    createdAt : Time.Time;
    themePreference : ?Text;
    targetRole : ?Text;
  };

  public type InterviewResponse = {
    answer : Text;
    feedback : Text;
    rating : Nat8;
    createdAt : Time.Time;
  };

  public type QuizQuestion = {
    id : Text;
    question : Text;
    options : [Text];
    correctAnswer : Nat8;
    role : Text;
    difficulty : Text;
  };

  public type QuizResult = {
    id : Text;
    user : Principal;
    score : Nat;
    completedAt : Time.Time;
    role : Text;
  };

  public type CandidateReview = {
    id : Text;
    user : Principal;
    chatBotScores : [Nat];
    liveMockScores : [Nat];
    resumeScore : ?Nat;
    overallRating : Nat;
    strengths : Text;
    weaknesses : Text;
    recommendations : Text;
    createdAt : Time.Time;
  };

  public type InterviewSettings = {
    targetRole : Text;
    interviewType : Text;
    difficulty : Text;
    questionCount : Nat;
  };

  public type ResumeStatus = {
    hasUploaded : Bool;
    lastUploadedAt : ?Time.Time;
  };

  module UserProfile {
    public func compare(profile1 : UserProfile, profile2 : UserProfile) : Order.Order {
      Text.compare(profile1.fullName, profile2.fullName);
    };

    public func compareByExperienceLevel(profile1 : UserProfile, profile2 : UserProfile) : Order.Order {
      Text.compare(profile1.experienceLevel, profile2.experienceLevel);
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let resumeFiles = Map.empty<Text, Resume>();
  let interviewSessions = Map.empty<Text, InterviewSession>();
  let liveMockData = Map.empty<Text, LiveMockInterviewData>();
  let interviewResponses = Map.empty<Principal, [InterviewResponse]>();
  let quizQuestions = Map.empty<Text, QuizQuestion>();
  let quizResults = Map.empty<Text, QuizResult>();
  let candidateReviews = Map.empty<Text, CandidateReview>();
  let interviewSettingsStore = Map.empty<Principal, InterviewSettings>();
  let resumeStatus = Map.empty<Principal, ResumeStatus>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    if (profile.id != caller) {
      Runtime.trap("Unauthorized: Profile ID must match caller");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getProfile(user : Principal) : async UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?profile) { profile };
    };
  };

  public shared ({ caller }) func saveProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    if (profile.id != caller) {
      Runtime.trap("Unauthorized: Profile ID must match caller");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getAllProfiles() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all profiles");
    };
    userProfiles.values().toArray().sort();
  };

  public query ({ caller }) func getAllProfilesByExperienceLevel() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all profiles");
    };
    userProfiles.values().toArray().sort(UserProfile.compareByExperienceLevel);
  };

  public shared ({ caller }) func uploadResume(resume : Resume) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload resumes");
    };
    if (resume.owner != caller) {
      Runtime.trap("Unauthorized: Can only upload your own resume");
    };
    resumeFiles.add(resume.id, resume);

    let status = {
      hasUploaded = true;
      lastUploadedAt = ?resume.uploadedAt;
    };
    resumeStatus.add(caller, status);
  };

  public query ({ caller }) func getResumeStatus(user : Principal) : async ResumeStatus {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own resume status");
    };
    switch (resumeStatus.get(user)) {
      case (null) { { hasUploaded = false; lastUploadedAt = null } };
      case (?status) { status };
    };
  };

  public query ({ caller }) func getResume(resumeId : Text) : async ?Resume {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access resumes");
    };
    switch (resumeFiles.get(resumeId)) {
      case (null) { null };
      case (?resume) {
        if (resume.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access your own resume");
        };
        ?resume;
      };
    };
  };

  public shared ({ caller }) func getCallerResumes() : async [Resume] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access resumes");
    };
    resumeFiles.values().toArray().filter(
      func(resume) { resume.owner == caller }
    );
  };

  public query ({ caller }) func getCallerLatestResume() : async ?Resume {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access resumes");
    };

    let userResumes = resumeFiles.values().toArray().filter(
      func(resume) { resume.owner == caller }
    );

    if (userResumes.size() == 0) {
      return null;
    };

    var latestResume = userResumes[0];
    for (resume in userResumes.values()) {
      if (resume.uploadedAt > latestResume.uploadedAt) {
        latestResume := resume;
      };
    };

    ?latestResume;
  };

  public query ({ caller }) func getUserLatestResume(user : Principal) : async ?Resume {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own resume");
    };

    let userResumes = resumeFiles.values().toArray().filter(
      func(resume) { resume.owner == user }
    );

    if (userResumes.size() == 0) {
      return null;
    };

    var latestResume = userResumes[0];
    for (resume in userResumes.values()) {
      if (resume.uploadedAt > latestResume.uploadedAt) {
        latestResume := resume;
      };
    };

    ?latestResume;
  };

  public shared ({ caller }) func saveInterviewSession(session : InterviewSession) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save interview sessions");
    };

    if (session.user != caller) {
      Runtime.trap("Unauthorized: Can only save your own interview sessions");
    };

    let hasResume = switch (resumeStatus.get(caller)) {
      case (?status) { status.hasUploaded };
      case (null) { false };
    };

    if (not hasResume) {
      Runtime.trap("Resume upload required. Please upload your resume before continuing.");
    };

    interviewSessions.add(session.id, session);
  };

  public shared ({ caller }) func saveLiveMockData(data : LiveMockInterviewData) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save live mock data");
    };
    if (data.user != caller) {
      Runtime.trap("Unauthorized: Can only save your own live mock data");
    };

    let hasResume = switch (resumeStatus.get(caller)) {
      case (?status) { status.hasUploaded };
      case (null) { false };
    };

    if (not hasResume) {
      Runtime.trap("Resume upload required. Please upload your resume before continuing.");
    };

    liveMockData.add(data.id, data);
  };

  public query ({ caller }) func getInterviewSessions(user : Principal) : async [InterviewSession] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own interview sessions");
    };
    interviewSessions.values().toArray().filter(
      func(session) { session.user == user }
    );
  };

  public query ({ caller }) func getLiveMockData(user : Principal) : async [LiveMockInterviewData] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own live mock data");
    };
    liveMockData.values().toArray().filter(
      func(data) { data.user == user }
    );
  };

  public shared ({ caller }) func addInterviewResponse(response : InterviewResponse) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit responses");
    };
    let existingResponses = switch (interviewResponses.get(caller)) {
      case (null) { [] };
      case (?responses) { responses };
    };

    let updatedResponses = existingResponses.concat([response]);
    interviewResponses.add(caller, updatedResponses);
  };

  public query ({ caller }) func getInterviewResponses(user : Principal) : async [InterviewResponse] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own responses");
    };
    switch (interviewResponses.get(user)) {
      case (null) { [] };
      case (?responses) { responses };
    };
  };

  public shared ({ caller }) func clearInterviewResponses() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear their responses");
    };
    interviewResponses.remove(caller);
  };

  public shared ({ caller }) func saveQuizQuestion(question : QuizQuestion) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can save quiz questions");
    };
    quizQuestions.add(question.id, question);
  };

  public query ({ caller }) func getQuizQuestions(role : Text, difficulty : Text) : async [QuizQuestion] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access questions");
    };
    quizQuestions.values().toArray().filter(
      func(question) { question.role == role and question.difficulty == difficulty }
    );
  };

  public shared ({ caller }) func saveQuizResult(result : QuizResult) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit quiz results");
    };
    if (result.user != caller) {
      Runtime.trap("Unauthorized: Can only save your own quiz results");
    };
    quizResults.add(result.id, result);
  };

  public query ({ caller }) func getQuizResults(user : Principal) : async [QuizResult] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own results");
    };
    quizResults.values().toArray().filter(
      func(result) { result.user == user }
    );
  };

  public shared ({ caller }) func saveCandidateReview(review : CandidateReview) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit reviews");
    };
    if (review.user != caller) {
      Runtime.trap("Unauthorized: Can only save your own reviews");
    };
    candidateReviews.add(review.id, review);
  };

  public query ({ caller }) func getCandidateReviews(user : Principal) : async [CandidateReview] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own reviews");
    };
    candidateReviews.values().toArray().filter(
      func(review) { review.user == user }
    );
  };

  public shared ({ caller }) func saveInterviewSettings(settings : InterviewSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save interview settings");
    };
    interviewSettingsStore.add(caller, settings);
  };

  public query ({ caller }) func getInterviewSettings() : async ?InterviewSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access settings");
    };
    interviewSettingsStore.get(caller);
  };

  public shared ({ caller }) func deleteResume(resumeId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete resumes");
    };

    switch (resumeFiles.get(resumeId)) {
      case (null) { Runtime.trap("Resume does not exist") };
      case (?resume) {
        if (resume.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own resume");
        };

        resumeFiles.remove(resumeId);

        let userResumes = resumeFiles.values().toArray().filter(
          func(r) { r.owner == resume.owner }
        );

        if (userResumes.size() == 0) {
          resumeStatus.add(resume.owner, { hasUploaded = false; lastUploadedAt = null });
        };
      };
    };
  };

  public query ({ caller }) func hasUploadedResume() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check resume status");
    };
    switch (resumeStatus.get(caller)) {
      case (?status) { status.hasUploaded };
      case (null) { false };
    };
  };

  public query ({ caller }) func getInterviewSessionsByTypeAndDifficulty(interviewType : Text, difficulty : Text) : async [InterviewSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query interview sessions");
    };

    let allSessions = interviewSessions.values().toArray();

    let filteredSessions = allSessions.filter(
      func(session) {
        (session.user == caller or AccessControl.isAdmin(accessControlState, caller)) and
        session.interviewType == interviewType and session.difficulty == difficulty
      }
    );

    filteredSessions;
  };

  public query ({ caller }) func getCandidateReviewsByRating(minRating : Nat, maxRating : Nat) : async [CandidateReview] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query candidate reviews");
    };

    let allReviews = candidateReviews.values().toArray();

    let filteredReviews = allReviews.filter(
      func(review) {
        (review.user == caller or AccessControl.isAdmin(accessControlState, caller)) and
        review.overallRating >= minRating and review.overallRating <= maxRating
      }
    );

    filteredReviews;
  };

  public shared ({ caller }) func verifyResumeRole(resumeId : Text, targetRole : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can verify resume roles");
    };

    switch (resumeFiles.get(resumeId)) {
      case (null) { Runtime.trap("Resume not found") };
      case (?resume) {
        if (resume.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only verify your own resume");
        };

        if (resume.targetRole != targetRole or not resume.verified) {
          Runtime.trap("Target role not verified. Please try again.");
        };
        true;
      };
    };
  };

  public query ({ caller }) func getImprovementSuggestions(resumeId : Text) : async [ImprovementSuggestion] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access improvement suggestions");
    };

    switch (resumeFiles.get(resumeId)) {
      case (null) { Runtime.trap("Resume not found") };
      case (?resume) {
        if (resume.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access suggestions for your own resume");
        };

        switch (resume.improvementDetails) {
          case (?details) { details };
          case (null) { Runtime.trap("No improvement suggestions found") };
        };
      };
    };
  };

  public query ({ caller }) func hasRoleVerifiedResume(targetRole : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check resume verification status");
    };

    let userResumes = resumeFiles.values().toArray().filter(
      func(resume) { resume.owner == caller }
    );

    if (userResumes.size() == 0) {
      return false;
    };

    for (resume in userResumes.values()) {
      if (resume.targetRole == targetRole and resume.verified) {
        return true;
      };
    };

    false;
  };

  public query ({ caller }) func hasRoleMismatchResume(targetRole : Text, verified : Bool) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check resume mismatch status");
    };

    let userResumes = resumeFiles.values().toArray().filter(
      func(resume) { resume.owner == caller }
    );

    if (userResumes.size() == 0) {
      return false;
    };

    for (resume in userResumes.values()) {
      if (resume.targetRole == targetRole and resume.verified == verified) {
        return true;
      };
    };

    false;
  };

  // Get Live Mock Interview Data with Session Started Filter
  public query ({ caller }) func getLiveMockDataBySessionStarted(user : Principal, sessionStarted : Bool) : async [LiveMockInterviewData] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access live mock data");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own live mock data");
    };

    let allData = liveMockData.values().toArray();
    let filteredData = allData.filter(
      func(data) {
        data.user == user and data.sessionStarted == sessionStarted
      }
    );
    filteredData;
  };

  // Mark Live Mock Interview Session as Started
  public shared ({ caller }) func markLiveMockSessionStarted(sessionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update session status");
    };

    switch (liveMockData.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?data) {
        if (data.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own session");
        };

        let updatedData = { data with sessionStarted = true };
        liveMockData.add(sessionId, updatedData);
      };
    };
  };

  // Check if Live Mock Interview Session Has Started
  public query ({ caller }) func isLiveMockSessionStarted(sessionId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check session status");
    };

    switch (liveMockData.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?data) {
        if (data.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only check your own session status");
        };
        data.sessionStarted;
      };
    };
  };
};
