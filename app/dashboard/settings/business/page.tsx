"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getUser } from "@/app/actions/auth";
import { updateFOPSettings } from "@/app/actions/settings";
import { Loader2, Save, MapPin, Briefcase } from "lucide-react";
import MotionWrapper from "@/components/MotionWrapper";
import ProfileExport from "@/components/dashboard/settings/ProfileExport";

interface FopFormData {
    legalName: string;
    ipn: string;
    group: number | string;
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
}

export default function BusinessSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [fopData, setFopData] = useState<FopFormData>({
        legalName: "",
        ipn: "",
        group: 3,
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
        expenseCategories: ""
    });

    useEffect(() => {
        async function loadData() {
            const user = await getUser();
            if (user && user.settings) {
                setFopData({
                    ...user.settings,
                    city: user.settings.city || "",
                    street: user.settings.street || "",
                    houseNumber: user.settings.houseNumber || "",
                    zipCode: user.settings.zipCode || "",
                    taxRatePercent: typeof user.settings.taxRate === "number" ? (user.settings.taxRate * 100).toString() : "",
                    fixedMonthlyTax: user.settings.fixedMonthlyTax?.toString() || "",
                    esvMonthly: user.settings.esvMonthly?.toString() || "",
                    incomeLimit: user.settings.incomeLimit?.toString() || "",
                    reportingPeriod: user.settings.reportingPeriod || "quarterly",
                    taxPaymentDay: user.settings.taxPaymentDay?.toString() || "",
                    reportDay: user.settings.reportDay?.toString() || "",
                    iban: user.settings.iban || "",
                    phone: user.settings.phone || "",
                    email: user.settings.email || "",
                    registrationDate: user.settings.registrationDate
                      ? new Date(user.settings.registrationDate).toISOString().slice(0, 10)
                      : "",
                    taxOffice: user.settings.taxOffice || "",
                    expenseCategories: user.settings.expenseCategories || ""
                });
            }
            setLoading(false);
        }
        loadData();
    }, []);

    const handleFOPSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const fullAddress = `${fopData.zipCode}, ${fopData.city}, ${fopData.street}, ${fopData.houseNumber}`;
        const res = await updateFOPSettings({
            legalName: fopData.legalName,
            ipn: fopData.ipn,
            group: Number(fopData.group),
            address: fullAddress,
            city: fopData.city,
            street: fopData.street,
            houseNumber: fopData.houseNumber,
            zipCode: fopData.zipCode,
            kveds: fopData.kveds,
            taxRate: fopData.taxRatePercent ? Number(fopData.taxRatePercent) / 100 : undefined,
            fixedMonthlyTax: fopData.fixedMonthlyTax ? Number(fopData.fixedMonthlyTax) : undefined,
            esvMonthly: fopData.esvMonthly ? Number(fopData.esvMonthly) : undefined,
            incomeLimit: fopData.incomeLimit ? Number(fopData.incomeLimit) : undefined,
            reportingPeriod: fopData.reportingPeriod || undefined,
            taxPaymentDay: fopData.taxPaymentDay ? Number(fopData.taxPaymentDay) : undefined,
            reportDay: fopData.reportDay ? Number(fopData.reportDay) : undefined,
            iban: fopData.iban || undefined,
            phone: fopData.phone || undefined,
            email: fopData.email || undefined,
            registrationDate: fopData.registrationDate ? new Date(fopData.registrationDate) : undefined,
            taxOffice: fopData.taxOffice || undefined,
            expenseCategories: fopData.expenseCategories || undefined
        });
        setSaving(false);
        if(res.success) alert("Дані ФОП збережено!");
        else alert("Помилка збереження");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--fin-primary)]" />
            </div>
        );
    }

    return (
        <MotionWrapper>
            <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 relative overflow-hidden">
                <div className="mb-10 pb-8 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Дані ФОП</h2>
                            <p className="text-gray-500 text-sm mt-1">Детальні налаштування фізичної особи-підприємця.</p>
                        </div>
                        <ProfileExport />
                    </div>
                </div>

                <form onSubmit={handleFOPSave} className="space-y-8">
                        {/* Basic Info */}
                        <div className="space-y-6">
                        <Input 
                            label="Повна назва ФОП"
                            type="text" 
                            placeholder="ФОП Петренко Петро Петрович" 
                            value={fopData.legalName || ""}
                            onChange={(e) => setFopData({...fopData, legalName: e.target.value})}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                                label="ІПН (РНОКПП)"
                                type="text" 
                                placeholder="1234567890" 
                                maxLength={10} 
                                value={fopData.ipn || ""}
                                onChange={(e) => setFopData({...fopData, ipn: e.target.value})}
                                leftIcon={<Briefcase className="w-4 h-4" />}
                                className="font-mono"
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Група оподаткування</label>
                                <select 
                                    value={fopData.group || 3}
                                    onChange={(e) => setFopData({...fopData, group: e.target.value})}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[var(--fin-primary)] outline-none transition-all cursor-pointer"
                                >
                                    <option value="1">1 група</option>
                                    <option value="2">2 група</option>
                                    <option value="3">3 група</option>
                                    <option value="4">4 група</option>
                                </select>
                            </div>
                        </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Tax Settings */}
                        <div className="space-y-6">
                        <h3 className="font-bold text-gray-900">Податкові параметри</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input 
                                label="Ставка податку (%)"
                                type="number" 
                                placeholder="5" 
                                value={fopData.taxRatePercent || ""}
                                onChange={(e) => setFopData({...fopData, taxRatePercent: e.target.value})}
                            />
                            <Input 
                                label="Фіксований податок/міс"
                                type="number" 
                                placeholder="0" 
                                value={fopData.fixedMonthlyTax || ""}
                                onChange={(e) => setFopData({...fopData, fixedMonthlyTax: e.target.value})}
                            />
                            <Input 
                                label="ЄСВ/міс"
                                type="number" 
                                placeholder="0" 
                                value={fopData.esvMonthly || ""}
                                onChange={(e) => setFopData({...fopData, esvMonthly: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input 
                                label="Ліміт доходу (річний)"
                                type="number" 
                                placeholder="0" 
                                value={fopData.incomeLimit || ""}
                                onChange={(e) => setFopData({...fopData, incomeLimit: e.target.value})}
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Період звітності</label>
                                <select 
                                    value={fopData.reportingPeriod || "quarterly"}
                                    onChange={(e) => setFopData({...fopData, reportingPeriod: e.target.value})}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[var(--fin-primary)] outline-none transition-all cursor-pointer"
                                >
                                    <option value="monthly">Щомісяця</option>
                                    <option value="quarterly">Щокварталу</option>
                                    <option value="yearly">Щороку</option>
                                </select>
                            </div>
                            <Input 
                                label="День сплати податку"
                                type="number" 
                                placeholder="20" 
                                value={fopData.taxPaymentDay || ""}
                                onChange={(e) => setFopData({...fopData, taxPaymentDay: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input 
                                label="День подачі звіту"
                                type="number" 
                                placeholder="20" 
                                value={fopData.reportDay || ""}
                                onChange={(e) => setFopData({...fopData, reportDay: e.target.value})}
                            />
                        </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Address */}
                        <div className="space-y-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-[var(--fin-primary)]" />
                            Адреса реєстрації
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input 
                                label="Місто"
                                type="text" 
                                placeholder="Київ" 
                                value={fopData.city || ""}
                                onChange={(e) => setFopData({...fopData, city: e.target.value})}
                            />
                            <Input 
                                label="Індекс"
                                type="text" 
                                placeholder="02000" 
                                value={fopData.zipCode || ""}
                                onChange={(e) => setFopData({...fopData, zipCode: e.target.value})}
                            />
                        </div>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-2">
                                <Input 
                                    label="Вулиця"
                                    type="text" 
                                    placeholder="Хрещатик" 
                                    value={fopData.street || ""}
                                    onChange={(e) => setFopData({...fopData, street: e.target.value})}
                                />
                                </div>
                                <Input 
                                label="Будинок/Кв"
                                type="text" 
                                placeholder="1 кв. 1" 
                                value={fopData.houseNumber || ""}
                                onChange={(e) => setFopData({...fopData, houseNumber: e.target.value})}
                            />
                        </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Document Data */}
                        <div className="space-y-6">
                        <h3 className="font-bold text-gray-900">Реквізити для документів</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                                label="IBAN"
                                type="text" 
                                placeholder="UA00 0000 0000 0000 0000 0000 0000" 
                                value={fopData.iban || ""}
                                onChange={(e) => setFopData({...fopData, iban: e.target.value})}
                                className="font-mono"
                            />
                            <Input 
                                label="Телефон"
                                type="tel" 
                                placeholder="+380..." 
                                value={fopData.phone || ""}
                                onChange={(e) => setFopData({...fopData, phone: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                                label="Email для звітів"
                                type="email" 
                                placeholder="you@domain.com" 
                                value={fopData.email || ""}
                                onChange={(e) => setFopData({...fopData, email: e.target.value})}
                            />
                            <Input 
                                label="Дата реєстрації"
                                type="date" 
                                value={fopData.registrationDate || ""}
                                onChange={(e) => setFopData({...fopData, registrationDate: e.target.value})}
                            />
                        </div>
                        <Input 
                            label="Податкова/ДПС"
                            type="text" 
                            placeholder="Податкова №..." 
                            value={fopData.taxOffice || ""}
                            onChange={(e) => setFopData({...fopData, taxOffice: e.target.value})}
                        />
                        </div>

                        <hr className="border-gray-100" />

                        {/* Expense Dictionary */}
                        <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Категорії витрат (довідник)</label>
                            <textarea 
                                rows={3} 
                                placeholder="Офіс, Маркетинг, Транспорт..." 
                                value={fopData.expenseCategories || ""}
                                onChange={(e) => setFopData({...fopData, expenseCategories: e.target.value})}
                                className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[var(--fin-primary)] outline-none transition-all resize-none"
                            ></textarea>
                            <p className="text-xs text-gray-500">Розділяйте категорії комою або з нового рядка.</p>
                        </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* KVEDs */}
                        <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">КВЕДи</label>
                            <textarea 
                                rows={3} 
                                placeholder="62.01, 73.11..." 
                                value={fopData.kveds || ""}
                                onChange={(e) => setFopData({...fopData, kveds: e.target.value})}
                                className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[var(--fin-primary)] outline-none transition-all resize-none"
                            ></textarea>
                        </div>
                        </div>

                        <div className="pt-6">
                        <Button 
                            type="submit" 
                            disabled={saving} 
                            isLoading={saving}
                            leftIcon={<Save className="w-5 h-5" />}
                            size="lg"
                        >
                            Зберегти дані ФОП
                        </Button>
                    </div>
                </form>
            </div>
        </MotionWrapper>
    );
}
