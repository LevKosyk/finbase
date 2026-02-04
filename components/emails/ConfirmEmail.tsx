import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ConfirmEmailProps {
    validationCode?: string;
    baseUrl?: string;
}

export const ConfirmEmail = ({
    validationCode = "123456",
    baseUrl = "https://finbase.app",
}: ConfirmEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Ваш код підтвердження Finbase</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans px-2">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <Text className="text-[var(--fin-primary)] text-2xl font-bold text-center p-0 my-0 mx-auto text-blue-600">
                                Finbase
                            </Text>
                        </Section>
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            <strong>Підтвердження пошти</strong>
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Вітаємо!
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Використовуйте цей код для завершення реєстрації та підтвердження вашої електронної адреси:
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Text className="text-4xl font-bold tracking-widest text-blue-600 py-4 bg-gray-50 rounded-lg mx-auto w-full max-w-[200px] border border-gray-100">
                                {validationCode}
                            </Text>
                        </Section>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Якщо ви не запитували цей код, просто проігноруйте цей лист.
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Text className="text-[#666666] text-[12px] leading-[24px]">
                                Цей код дійсний протягом 10 хвилин.
                            </Text>
                        </Section>
                    </Container>
                    <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
                        © 2026 Finbase. Всі права захищено.
                    </Text>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default ConfirmEmail;
