export type DoctorAvatarState =
  | "WELCOME"
  | "IDLE"
  | "WAVING"
  | "THINKING"
  | "ASKING"
  | "DIAGNOSIS_READY"
  | "WARNING"
  | "UNAVAILABLE"
  | "SESSION_EXPIRED";

export const doctorStateLabel: Record<DoctorAvatarState, string> = {
  WELCOME: "دكتور ArtVert يرحب بك",
  IDLE: "دكتور ArtVert جاهز للمساعدة",
  WAVING: "دكتور ArtVert يلوّح لك",
  THINKING: "دكتور ArtVert يراجع المعلومات",
  ASKING: "دكتور ArtVert يطرح سؤال متابعة",
  DIAGNOSIS_READY: "دكتور ArtVert أعدّ ملخصاً",
  WARNING: "دكتور ArtVert لديه تنبيه",
  UNAVAILABLE: "دكتور ArtVert غير متاح حالياً",
  SESSION_EXPIRED: "انتهت جلسة دكتور ArtVert",
};
