"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type IncomeFiltersState = {
  q: string;
  type: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
};

type ExpenseFiltersState = {
  q: string;
  category: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
};

type StatisticsFiltersState = {
  period: "month" | "quarter" | "year" | "custom";
  from: string;
  to: string;
};

export type ChatMessageDraft = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ProfileDraftState = {
  userId: string;
  firstName: string;
  lastName: string;
};

type DocumentDraftState = {
  type: "declaration" | "payment" | "act" | "invoice" | "rakhunok";
  format: "pdf" | "json";
  dateFrom: string;
  dateTo: string;
  number: string;
  counterparty: string;
  counterpartyTaxId: string;
  description: string;
  amount: string;
  currency: string;
  selectedTemplateId: string;
};

type BusinessSettingsDraftState = {
  userId: string;
  legalName: string;
  ipn: string;
  address: string;
  city: string;
  street: string;
  houseNumber: string;
  zipCode: string;
  kveds: string;
  taxRatePercent: string;
  fixedMonthlyTax: string;
  esvMonthly: string;
  incomeLimit: string;
  reportingPeriod: string;
  taxPaymentDay: string;
  reportDay: string;
  iban: string;
  phone: string;
  email: string;
  registrationDate: string;
  taxOffice: string;
  expenseCategories: string;
};

type DashboardStore = {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  lastVisitedPath: string;
  incomeFiltersOpen: boolean;
  expenseFiltersOpen: boolean;
  incomeFilters: IncomeFiltersState;
  expenseFilters: ExpenseFiltersState;
  statisticsFilters: StatisticsFiltersState;
  profileDraft: ProfileDraftState;
  documentDraft: DocumentDraftState;
  businessSettingsDraft: BusinessSettingsDraftState;
  chatInputDraft: string;
  chatMessagesDraft: ChatMessageDraft[];
  setSidebarOpen: (value: boolean) => void;
  setSidebarCollapsed: (value: boolean) => void;
  setLastVisitedPath: (value: string) => void;
  setIncomeFiltersOpen: (value: boolean) => void;
  setExpenseFiltersOpen: (value: boolean) => void;
  setIncomeFilters: (patch: Partial<IncomeFiltersState>) => void;
  setExpenseFilters: (patch: Partial<ExpenseFiltersState>) => void;
  setStatisticsFilters: (patch: Partial<StatisticsFiltersState>) => void;
  setProfileDraft: (patch: Partial<ProfileDraftState>) => void;
  resetProfileDraft: () => void;
  setDocumentDraft: (patch: Partial<DocumentDraftState>) => void;
  resetDocumentDraft: () => void;
  setBusinessSettingsDraft: (patch: Partial<BusinessSettingsDraftState>) => void;
  resetBusinessSettingsDraft: () => void;
  setChatInputDraft: (value: string) => void;
  setChatMessagesDraft: (messages: ChatMessageDraft[]) => void;
  appendChatMessageDraft: (message: ChatMessageDraft) => void;
  resetChatDraft: () => void;
  resetIncomeFilters: () => void;
  resetExpenseFilters: () => void;
  resetStatisticsFilters: () => void;
};

const incomeDefaults: IncomeFiltersState = {
  q: "",
  type: "all",
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
};

const expenseDefaults: ExpenseFiltersState = {
  q: "",
  category: "all",
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
};

const statisticsDefaults: StatisticsFiltersState = {
  period: "year",
  from: "",
  to: "",
};

const profileDraftDefaults: ProfileDraftState = {
  userId: "",
  firstName: "",
  lastName: "",
};

const documentDraftDefaults: DocumentDraftState = {
  type: "declaration",
  format: "pdf",
  dateFrom: "",
  dateTo: "",
  number: "",
  counterparty: "",
  counterpartyTaxId: "",
  description: "",
  amount: "",
  currency: "UAH",
  selectedTemplateId: "",
};

const businessSettingsDraftDefaults: BusinessSettingsDraftState = {
  userId: "",
  legalName: "",
  ipn: "",
  address: "",
  city: "",
  street: "",
  houseNumber: "",
  zipCode: "",
  kveds: "",
  taxRatePercent: "",
  fixedMonthlyTax: "",
  esvMonthly: "",
  incomeLimit: "",
  reportingPeriod: "quarterly",
  taxPaymentDay: "",
  reportDay: "",
  iban: "",
  phone: "",
  email: "",
  registrationDate: "",
  taxOffice: "",
  expenseCategories: "",
};

const defaultChatGreeting: ChatMessageDraft = {
  role: "assistant",
  content: "Привіт! Я ваш фінансовий асистент Finbase AI. Я знаю ваші доходи та податкову групу. Чим можу допомогти?",
};

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      lastVisitedPath: "/dashboard",
      incomeFiltersOpen: false,
      expenseFiltersOpen: false,
      incomeFilters: incomeDefaults,
      expenseFilters: expenseDefaults,
      statisticsFilters: statisticsDefaults,
      profileDraft: profileDraftDefaults,
      documentDraft: documentDraftDefaults,
      businessSettingsDraft: businessSettingsDraftDefaults,
      chatInputDraft: "",
      chatMessagesDraft: [defaultChatGreeting],
      setSidebarOpen: (value) => set({ sidebarOpen: value }),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      setLastVisitedPath: (value) => set({ lastVisitedPath: value }),
      setIncomeFiltersOpen: (value) => set({ incomeFiltersOpen: value }),
      setExpenseFiltersOpen: (value) => set({ expenseFiltersOpen: value }),
      setIncomeFilters: (patch) =>
        set((state) => ({ incomeFilters: { ...state.incomeFilters, ...patch } })),
      setExpenseFilters: (patch) =>
        set((state) => ({ expenseFilters: { ...state.expenseFilters, ...patch } })),
      setStatisticsFilters: (patch) =>
        set((state) => ({ statisticsFilters: { ...state.statisticsFilters, ...patch } })),
      setProfileDraft: (patch) =>
        set((state) => ({ profileDraft: { ...state.profileDraft, ...patch } })),
      resetProfileDraft: () => set({ profileDraft: profileDraftDefaults }),
      setDocumentDraft: (patch) =>
        set((state) => ({ documentDraft: { ...state.documentDraft, ...patch } })),
      resetDocumentDraft: () => set({ documentDraft: documentDraftDefaults }),
      setBusinessSettingsDraft: (patch) =>
        set((state) => ({ businessSettingsDraft: { ...state.businessSettingsDraft, ...patch } })),
      resetBusinessSettingsDraft: () => set({ businessSettingsDraft: businessSettingsDraftDefaults }),
      setChatInputDraft: (value) => set({ chatInputDraft: value }),
      setChatMessagesDraft: (messages) => set({ chatMessagesDraft: messages }),
      appendChatMessageDraft: (message) =>
        set((state) => ({ chatMessagesDraft: [...state.chatMessagesDraft, message] })),
      resetChatDraft: () => set({ chatInputDraft: "", chatMessagesDraft: [defaultChatGreeting] }),
      resetIncomeFilters: () => set({ incomeFilters: incomeDefaults }),
      resetExpenseFilters: () => set({ expenseFilters: expenseDefaults }),
      resetStatisticsFilters: () => set({ statisticsFilters: statisticsDefaults }),
    }),
    {
      name: "finbase-dashboard-store-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        lastVisitedPath: state.lastVisitedPath,
        incomeFiltersOpen: state.incomeFiltersOpen,
        expenseFiltersOpen: state.expenseFiltersOpen,
        incomeFilters: state.incomeFilters,
        expenseFilters: state.expenseFilters,
        statisticsFilters: state.statisticsFilters,
        profileDraft: state.profileDraft,
        documentDraft: state.documentDraft,
        businessSettingsDraft: state.businessSettingsDraft,
        chatInputDraft: state.chatInputDraft,
        chatMessagesDraft: state.chatMessagesDraft,
      }),
    }
  )
);
