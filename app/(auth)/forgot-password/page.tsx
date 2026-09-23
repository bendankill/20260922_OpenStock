import FooterLink from '@/components/forms/FooterLink';
import OpenDevSocietyBranding from '@/components/OpenDevSocietyBranding';

const ForgotPasswordPage = () => {
    return (
        <>
            <h1 className="form-title">忘记密码？</h1>
            <p className="text-sm text-gray-400 mb-6">
                当前本地版本不支持邮件找回密码。忘记密码请联系本地管理员重置。
            </p>

            <FooterLink text="想起密码了？" linkText="返回登录" href="/sign-in" />
            <OpenDevSocietyBranding outerClassName="mt-10 flex justify-center" />
        </>
    );
};

export default ForgotPasswordPage;
