import React from "react";
import { FiClock, FiStar } from "react-icons/fi";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";

const renderFeatureList = (features) => {
  if (!features) return null;
  const items = features
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!items.length) return null;

  return (
    <ul className="mt-4 space-y-2">
      {items.map((feature, idx) => (
        <li key={`${feature}-${idx}`} className="flex items-start text-sm">
          <FiStar className="mt-0.5 mr-2 text-yellow-500 flex-shrink-0" />
          <span className="leading-snug text-gray-700">{feature}</span>
        </li>
      ))}
    </ul>
  );
};

const LimitBadge = ({ label, value }) => {
  if (value === null || value === undefined || value <= 0) return null;
  return (
    <span className="px-3 py-1 text-xs font-semibold text-blue-700 rounded-full bg-blue-50">
      {label}: {value}
    </span>
  );
};

const ActivePlanCard = ({ plan, isVip, fallbackPlan, roleLabel }) => {
  if (isVip && !plan) {
    return (
      <div className="p-6 mb-8 border rounded-2xl border-amber-200 bg-amber-50 text-amber-800">
        <p className="text-sm font-semibold tracking-wider uppercase">
          Gói đang sử dụng
        </p>
        <p className="mt-2 text-sm">
          Người dùng đang có gói VIP hoạt động nhưng dữ liệu snapshot chưa sẵn
          sàng. Vui lòng tải lại trang sau khi hoàn tất đồng bộ hoặc liên hệ hỗ
          trợ.
        </p>
      </div>
    );
  }

  const displayPlan = isVip ? plan : fallbackPlan;

  if (!displayPlan) return null;

  const startDate = isVip ? formatDate(displayPlan.StartDate) : null;
  const endDate = isVip ? formatDate(displayPlan.EndDate) : null;
  const isSubscription = displayPlan.PlanType === "SUBSCRIPTION";

  return (
    <div className="p-6 mb-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            {isVip ? "Gói VIP đang sử dụng" : "Gói cơ bản hiện tại"}
          </p>
          <h3 className="mt-1 text-2xl font-bold text-gray-900">
            {displayPlan.PlanName || "Gói Cơ Bản"}
          </h3>
          <p className="text-sm text-gray-500">
            {isSubscription ? "Gói định kỳ" : "Dịch vụ mua 1 lần"}
          </p>
        </div>
        <div className="text-right">
          <p className="mb-1 text-sm text-gray-500">Giá trị gói</p>
          <p className="text-3xl font-extrabold text-gray-900">
            {formatCurrency(displayPlan.Price || 0)}
          </p>
          {isVip && startDate && (
            <p className="inline-flex items-center mt-2 text-sm text-gray-500">
              <FiClock className="mr-1" />
              {isSubscription && endDate
                ? `${startDate} - ${endDate}`
                : `Kích hoạt: ${startDate}`}
            </p>
          )}
          {!isVip && (
            <p className="mt-2 text-sm text-gray-500">
              Gói mặc định cho {roleLabel}.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <LimitBadge
          label={roleLabel === "tuyển dụng" ? "Đăng bài/ngày" : "CV lưu trữ"}
          value={
            roleLabel === "tuyển dụng"
              ? displayPlan.Limit_JobPostDaily
              : displayPlan.Limit_CVStorage
          }
        />
        <LimitBadge
          label="Đẩy top/ngày"
          value={displayPlan.Limit_PushTopDaily}
        />
        {roleLabel === "tuyển dụng" && (
          <LimitBadge label="Kho CV" value={displayPlan.Limit_CVStorage} />
        )}
      </div>

      {renderFeatureList(displayPlan.Features) || (
        <p className="mt-4 text-sm italic text-gray-500">
          Gói này không có mô tả chi tiết.
        </p>
      )}
    </div>
  );
};

export default ActivePlanCard;