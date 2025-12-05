import axios from "axios";

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export const createSubAccount = async (vendor: {
  businessName: string;
  bankCode: string;     // For Ghana MoMo: "MTN", "VOD", "ATL"
  accountNumber: string; // Phone number for MoMo
  percentageCharge?: number;
}) => {
  const payload = {
    business_name: vendor.businessName,
    settlement_bank: vendor.bankCode,
    account_number: vendor.accountNumber,
    percentage_charge: vendor.percentageCharge ?? 0,
  };

  const response = await paystack.post("/subaccount", payload);
  return response.data; // Contains subaccount_code
};
