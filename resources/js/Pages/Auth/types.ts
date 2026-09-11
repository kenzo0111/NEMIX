export interface PublicInstitutionBranding {
    institutionName: string;
    acronym?: string;
    officeName: string;
    logoUrl?: string;
}

export interface LoginPageProps {
    status?: string;
    canResetPassword: boolean;
    branding?: PublicInstitutionBranding;
}

export interface RegisterPageProps {
    email?: string;
    token?: string;
    branding?: PublicInstitutionBranding;
}

export interface ForgotPasswordPageProps {
    status?: string;
    branding?: PublicInstitutionBranding;
}

export interface ResetPasswordPageProps {
    token: string;
    email: string;
    branding?: PublicInstitutionBranding;
}

export interface ConfirmPasswordPageProps {
    branding?: PublicInstitutionBranding;
}

export interface VerifyEmailPageProps {
    status?: string;
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        status?: string;
    };
    branding?: PublicInstitutionBranding;
}
