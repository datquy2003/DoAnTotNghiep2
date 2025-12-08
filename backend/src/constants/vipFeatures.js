export const VIP_FEATURE_KEYS = {
  CANDIDATE_COMPETITOR_INSIGHT: "CANDIDATE_COMPETITOR_INSIGHT",
  EMPLOYER_REVEAL_PHONE: "EMPLOYER_REVEAL_PHONE",
};

export const VIP_FEATURE_CONFIG = {
  [VIP_FEATURE_KEYS.CANDIDATE_COMPETITOR_INSIGHT]: {
    snapshotColumn: "Snapshot_ViewApplicantCount",
    planColumn: "Limit_ViewApplicantCount",
    description:
      "Cho phép ứng viên xem số lượng người khác đã ứng tuyển vào cùng một tin tuyển dụng.",
  },
  [VIP_FEATURE_KEYS.EMPLOYER_REVEAL_PHONE]: {
    snapshotColumn: "Snapshot_RevealCandidatePhone",
    planColumn: "Limit_RevealCandidatePhone",
    description:
      "Cho phép nhà tuyển dụng hiển thị số điện thoại của ứng viên đã cho phép truy cập.",
  },
};

export const getVipFeatureConfig = (featureKey) => {
  const config = VIP_FEATURE_CONFIG[featureKey];
  if (!config) {
    throw new Error(`Unknown VIP feature: ${featureKey}`);
  }
  return config;
};
