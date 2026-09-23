'use client';

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import PasswordRequirements from "@/components/forms/PasswordRequirements";
import { ACCOUNT_VALIDATION, PASSWORD_VALIDATION } from "@/lib/constants";
import FooterLink from "@/components/forms/FooterLink";
import { signUpWithAccount } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import OpenDevSocietyBranding from "@/components/OpenDevSocietyBranding";
import React from "react";

const SignUp = () => {
    const router = useRouter()
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormData>({
        defaultValues: {
            account: '',
            password: '',
        },
        mode: 'onBlur'
    },);

    const passwordValue = watch('password');

    const onSubmit = async (data: SignUpFormData) => {
        try {
            const result = await signUpWithAccount(data);
            if (result.success) {
                router.push('/');
                return;
            }
            toast.error('注册失败', {
                description: result.error ?? '无法创建账号，请稍后重试。',
            });
        } catch (e) {
            console.error(e);
            toast.error('注册失败', {
                description: e instanceof Error ? e.message : '无法创建账号，请稍后重试。'
            })
        }
    }

    return (
        <>
            <h1 className="form-title">创建账号</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="account"
                    label="账号"
                    placeholder="请输入账号"
                    register={register}
                    error={errors.account}
                    validation={ACCOUNT_VALIDATION}
                />

                <InputField
                    name="password"
                    label="密码"
                    placeholder="请输入密码"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={PASSWORD_VALIDATION}
                />
                <PasswordRequirements password={passwordValue ?? ''} />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? '正在创建账号' : '注册并进入 OpenStock'}
                </Button>

                <FooterLink text="已有账号？" linkText="登录" href="/sign-in" />

                <OpenDevSocietyBranding outerClassName="mt-10 flex justify-center" />
                <div className="mt-5 flex justify-center">
                    <a href="https://peerlist.io/ravixalgorithm/project/openstock" target="_blank" rel="noreferrer">
                        <img
                            src="https://peerlist.io/api/v1/projects/embed/PRJH8OED7MBL9MGB9HRMKAKLM66KNN?showUpvote=true&theme=light"
                            alt="OpenStock"
                            style={{ width: 'auto', height: '72px' }}
                        />
                    </a>
                </div>
            </form>
        </>
    )
}
export default SignUp;
