export const translations = {
  en: {
    feedbackButton: "Feedback",
    cancelButton: "Cancel",
    messagePlaceholder: "What would you like to tell us?",
    messageLabel: "Message",
    nameLabel: "Name (optional)",
    emailLabel: "Email (optional)",
    submitButton: "Send feedback",
    submitting: "Sending...",
    successMessage: "Thank you!",
    successDescription: "Your feedback has been submitted.",
    errorTitle: "Error",
    clickToPlace: "Click anywhere to place a feedback pin",
    feedbackSubmitted: "Feedback submitted",
    deleteFeedback: "Delete feedback",
    by: "by",
    anonymous: "Anonymous",
  },
  de: {
    feedbackButton: "Feedback",
    cancelButton: "Abbrechen",
    messagePlaceholder: "Was möchten Sie uns mitteilen?",
    messageLabel: "Nachricht",
    nameLabel: "Name (optional)",
    emailLabel: "E-Mail (optional)",
    submitButton: "Feedback senden",
    submitting: "Wird gesendet...",
    successMessage: "Vielen Dank!",
    successDescription: "Ihr Feedback wurde übermittelt.",
    errorTitle: "Fehler",
    clickToPlace: "Klicken Sie überall, um einen Feedback-Pin zu platzieren",
    feedbackSubmitted: "Feedback übermittelt",
    deleteFeedback: "Feedback löschen",
    by: "von",
    anonymous: "Anonym",
  },
} as const;

export type Language = keyof typeof translations;

export function getTranslations(lang: Language) {
  return translations[lang];
}
