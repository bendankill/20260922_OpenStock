'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import { signInWithAccount } from "@/lib/actions/auth.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import OpenDevSocietyBranding from "@/components/OpenDevSocietyBranding";
import React from "react";

const SignIn = () => {
    const router = useRouter()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        defaultValues: {
            account: '',
            password: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data: SignInFormData) => {
        try {
            const result = await signInWithAccount(data);
            if (result.success) {
                router.push('/');
                return;
            }
            toast.error('登录失败', {
                description: result.error ?? '账号或密码错误。',
            });
        } catch (e) {
            console.error(e);
            toast.error('登录失败', {
                description: e instanceof Error ? e.message : '账号或密码错误。'
            })
        }
    }

    return (
        <>
            <h1 className="form-title">登录</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="account"
                    label="账号"
                    placeholder="请输入账号"
                    register={register}
                    error={errors.account}
                    validation={{
                        required: '请输入账号',
                        minLength: { value: 2, message: '账号至少 2 个字符' },
                        maxLength: { value: 32, message: '账号最多 32 个字符' },
                        pattern: {
                            value: /^[\p{Script=Han}A-Za-z0-9]+$/u,
                            message: '账号只能包含中文、字母和数字',
                        },
                    }}
                />

                <InputField
                    name="password"
                    label="密码"
                    placeholder="请输入密码"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: '请输入密码', minLength: 2, maxLength: 128 }}
                />

                <div className="flex justify-end">
                    <span className="text-sm text-gray-500">忘记密码请联系本地管理员重置</span>
                </div>

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? '正在登录' : '登录'}
                </Button>

                <FooterLink text="还没有账号？" linkText="创建账号" href="/sign-up" />
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
    );
};
export default SignIn;
