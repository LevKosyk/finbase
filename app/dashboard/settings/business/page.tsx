"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getUser } from "@/app/actions/auth";
import { updateFOPSettings } from "@/app/actions/settings";
import { Loader2, Save, MapPin, Briefcase } from "lucide-react";
import MotionWrapper from "@/components/MotionWrapper";

export default function BusinessSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [fopData, setFopData] = useState<any>({
        legalName: "",
        ipn: "",
        group: 3,
        address: "", 
        city: "",
        street: "",
        houseNumber: "",
        zipCode: "",
        kveds: ""
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
            kveds: fopData.kveds
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
                    <h2 className="text-xl font-bold text-gray-900">Дані ФОП</h2>
                    <p className="text-gray-500 text-sm mt-1">Детальні налаштування фізичної особи-підприємця.</p>
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
                                    <option value="3">3 група (5%)</option>
                                </select>
                            </div>
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
