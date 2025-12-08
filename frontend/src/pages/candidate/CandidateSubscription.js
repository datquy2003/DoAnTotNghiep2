import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiCheck, FiLoader, FiPackage } from "react-icons/fi";
import toast from "react-hot-toast";
import { vipApi } from "../../api/vipApi";
import { paymentApi } from "../../api/paymentApi";
import { formatCurrency } from "../../utils/formatCurrency";
import { DEFAULT_LIMITS } from "../../constants/limitConstants";
import { useAuth } from "../../context/AuthContext";
import ActivePlanCard from "../../components/ActivePlanCard";

const FREE_PLAN = {
  PlanID: "FREE_PLAN",
  PlanName: "Gói Cơ Bản (Miễn Phí)",
  Price: 0,
  DurationInDays: 0,
  Features: `Đẩy top hồ sơ ${DEFAULT_LIMITS.CANDIDATE.PUSH_TOP_QTY} lần/tuần
Lưu trữ tối đa ${DEFAULT_LIMITS.CANDIDATE.CV_STORAGE} CV`,
  PlanType: "SUBSCRIPTION",
  Limit_CVStorage: DEFAULT_LIMITS.CANDIDATE.CV_STORAGE,
  Limit_PushTopDaily: DEFAULT_LIMITS.CANDIDATE.PUSH_TOP_QTY,
};

const CandidateSubscription = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const location = useLocation();
  const { appUser, manualReloadFirebaseUser } = useAuth();

  const isVip = !!appUser?.CurrentVIP;
  const currentVipName = appUser?.CurrentVIP || null;
  const currentPlanSnapshot = appUser?.CurrentVIPPlanName
    ? {
        PlanName: appUser.CurrentVIPPlanName,
        Price: appUser.CurrentVIPPrice,
        PlanType: appUser.CurrentVIPPlanType,
        Features: appUser.CurrentVIPFeatures,
        Limit_JobPostDaily: appUser.CurrentVIPLimitJobPostDaily,
        Limit_PushTopDaily: appUser.CurrentVIPLimitPushTopDaily,
        Limit_CVStorage: appUser.CurrentVIPLimitCVStorage,
        StartDate: appUser.CurrentVIPStartDate,
        EndDate: appUser.CurrentVIPEndDate,
      }
    : null;

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await vipApi.getVipPackages(4);
        const subscriptionPlans = (res.data || []).filter(
          (pkg) => pkg.PlanType === "SUBSCRIPTION"
        );
        setPlans([FREE_PLAN, ...subscriptionPlans]);
      } catch (error) {
        console.error("Lỗi tải gói VIP ứng viên:", error);
        toast.error("Không thể tải danh sách gói dịch vụ.");
        setPlans([FREE_PLAN]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    if (location.state?.reload) {
      manualReloadFirebaseUser();
    }
  }, [location.state, manualReloadFirebaseUser]);

  const handleBuyPackage = async (plan) => {
    if (plan.PlanID === "FREE_PLAN") return;

    setProcessingPlanId(plan.PlanID);
    const toastId = toast.loading("Đang tạo cổng thanh toán...");

    try {
      const response = await paymentApi.createCheckoutSession(plan.PlanID);
      if (response.data && response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error("Không nhận được đường dẫn thanh toán.", { id: toastId });
        setProcessingPlanId(null);
      }
    } catch (error) {
      console.error("Lỗi thanh toán ứng viên:", error);
      toast.error(
        error.response?.data?.message ||
          "Lỗi khi khởi tạo thanh toán. Vui lòng thử lại.",
        { id: toastId }
      );
      setProcessingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FiLoader className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Nâng cấp tài khoản ứng viên
        </h1>
        <p className="max-w-2xl mx-auto text-gray-600">
          Tăng độ hiển thị hồ sơ, mở khóa giới hạn CV và nhận huy hiệu xác thực
          để nổi bật trước nhà tuyển dụng.
        </p>
      </div>

      <ActivePlanCard
        plan={currentPlanSnapshot}
        isVip={isVip}
        fallbackPlan={FREE_PLAN}
        roleLabel="ứng viên"
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {plans.length > 0 ? (
          plans.map((plan) => {
            const isProcessing = processingPlanId === plan.PlanID;
            const isFreePlan = plan.PlanID === "FREE_PLAN";

            let buttonText = "Đăng ký ngay";
            let isDisabled = false;
            let buttonClass = "bg-blue-600 text-white hover:bg-blue-700";

            if (isFreePlan) {
              if (isVip) {
                buttonText = "Đã bao gồm";
                isDisabled = true;
                buttonClass =
                  "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed";
              } else {
                buttonText = "Đang sử dụng";
                isDisabled = true;
                buttonClass =
                  "bg-green-100 text-green-700 border-green-200 cursor-default";
              }
            } else if (currentVipName === plan.PlanName) {
              buttonText = "Đang sử dụng";
              isDisabled = true;
              buttonClass =
                "bg-green-100 text-green-700 border-green-200 cursor-default";
            } else if (isVip) {
              buttonText = "Đang dùng gói khác";
              isDisabled = true;
              buttonClass =
                "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed";
            }

            return (
              <div
                key={plan.PlanID}
                className={`flex flex-col bg-white rounded-2xl shadow-sm border transition-all duration-300 relative overflow-hidden p-2 ${
                  isFreePlan
                    ? "border-gray-200"
                    : "border-blue-100 hover:shadow-xl hover:border-blue-400"
                }`}
              >
                {!isFreePlan && (
                  <div className="absolute top-0 right-0 bg-gradient-to-bl from-blue-500 to-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10">
                    VIP
                  </div>
                )}

                <div className="flex flex-col flex-1 p-8">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {plan.PlanName}
                    </h3>
                    <div className="flex items-baseline mt-2 text-gray-900">
                      <span className="text-3xl font-extrabold tracking-tight">
                        {formatCurrency(plan.Price)}
                      </span>
                      {plan.DurationInDays > 0 && (
                        <span className="ml-1 text-sm font-medium text-gray-500">
                          / {plan.DurationInDays} ngày
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="flex-1 mb-6 space-y-3">
                    {plan.Features?.split("\n").map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0">
                          <FiCheck
                            className={`h-5 w-5 ${
                              isFreePlan ? "text-gray-400" : "text-green-500"
                            }`}
                          />
                        </div>
                        <p className="ml-3 text-sm leading-snug text-gray-600">
                          {feature}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => !isDisabled && handleBuyPackage(plan)}
                    disabled={isDisabled || isProcessing}
                    className={`w-full block border rounded-lg py-3 px-4 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm mt-auto ${buttonClass} flex justify-center items-center`}
                  >
                    {isProcessing ? (
                      <FiLoader className="w-5 h-5 animate-spin" />
                    ) : (
                      buttonText
                    )}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center border border-gray-300 border-dashed col-span-full bg-gray-50 rounded-xl">
            <FiPackage className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg text-gray-500">
              Hiện chưa có gói đăng ký nào khả dụng.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateSubscription;