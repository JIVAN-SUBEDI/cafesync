'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Key,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  Info,
  Shield,
  Lock,
} from 'lucide-react';
import { useHotelPassword } from '@/hooks/useHotelPassword';

interface HotelPasswordOTPProps {
  hotelSlug: string;
  onBack?: () => void;
}

export default function HotelPasswordOTP({ hotelSlug, onBack }: HotelPasswordOTPProps) {
  // const [step, goToStep] = useState<'select' | 'request' | 'verify' | 'change' | 'success'>('select');
  const [localError, setLocalError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    step,
    goToStep,
    otp,
    newPassword,
    confirmPassword,
    isLoading,
    error,
    message,
    countdown,
    tempToken, // Make sure this is being used
    emailType,
    hasRecoveryEmail,
    requestOTP,
    resendOTP,
    verifyOTP,
    changeWithOTP,
    resetPasswordFlow,
    clearMessages,
    updateOtp,
    updateNewPassword,
    updateConfirmPassword,
  } = useHotelPassword();

  // Debug: Log tempToken when it changes
  useEffect(() => {
    if (tempToken) {
      console.log('TempToken received in component:', tempToken);
    }
  }, [tempToken]);

  // Sync OTP inputs with Redux state
  useEffect(() => {
    if (otp) {
      const otpArray = otp.split('');
      const newOtpInputs = [...otpInputs];
      for (let i = 0; i < 6; i++) {
        newOtpInputs[i] = otpArray[i] || '';
      }
      setOtpInputs(newOtpInputs);
    }
  }, [otp]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[@$!%*?&]/.test(newPassword)) strength++;
    setPasswordStrength(strength);
  }, [newPassword]);

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      resetPasswordFlow();
    };
  }, [resetPasswordFlow]);

  // Auto-redirect after success
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        window.location.href = `/slug`;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, hotelSlug]);

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtpInputs = [...otpInputs];
    newOtpInputs[index] = value.slice(0, 1);
    setOtpInputs(newOtpInputs);
    
    // Update combined OTP
    const combinedOtp = newOtpInputs.join('');
    updateOtp(combinedOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmitEmail = async () => {
    if (!adminEmail.trim()) {
      setLocalError('Please enter your admin email');
      return;
    }

    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    setLocalError(null);
    try {
      await requestOTP(adminEmail);
      setEmailSubmitted(true);
      goToStep('verify');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to request OTP');
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setLocalError(null);
    try {
      await resendOTP(adminEmail);
      setOtpInputs(['', '', '', '', '', '']);
      updateOtp('');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to resend OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setLocalError('Please enter all 6 digits');
      return;
    }
    setLocalError(null);
    try {
      // Pass admin_email to verifyOTP
      const response = await verifyOTP(otp, adminEmail);
      console.log('Verify OTP response:', response);
      
      // The tempToken should be stored in Redux state automatically
      // Wait a moment to ensure Redux state is updated
      setTimeout(() => {
        console.log('After verify, checking tempToken in component...');
      }, 100);
      
      goToStep('change');
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      setLocalError(err.message || 'Failed to verify OTP');
    }
  };

  const handleChangeWithOTP = async () => {
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    if (passwordStrength < 4) {
      setLocalError('Please use a stronger password with uppercase, lowercase, numbers, and special characters');
      return;
    }
    
    // Debug: Check if tempToken exists before submitting
    console.log('Attempting to change password with tempToken:', tempToken);
    
    if (!tempToken) {
      setLocalError('Verification token not found. Please restart the process.');
      return;
    }
    
    setLocalError(null);
    try {
      await changeWithOTP(newPassword, confirmPassword, adminEmail);
      goToStep('success');
    } catch (err: any) {
      console.error('Change password error:', err);
      setLocalError(err.message || 'Failed to change password');
    }
  };

  const handleBack = () => {
    if (step === 'verify') {
      goToStep('request');
      setOtpInputs(['', '', '', '', '', '']);
      updateOtp('');
      setEmailSubmitted(false);
    } else if (step === 'change') {
      goToStep('verify');
      updateNewPassword('');
      updateConfirmPassword('');
      setPasswordStrength(0);
    } else if (step === 'request') {
      goToStep('select');
      setAdminEmail('');
      setEmailSubmitted(false);
    } else if (step === 'select' && onBack) {
      onBack();
    }
    setLocalError(null);
    clearMessages();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-green-500';
    return 'bg-emerald-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    if (passwordStrength <= 4) return 'Strong';
    return 'Very Strong';
  };

  const renderSelectStep = () => (
    <div className="space-y-4">
      <button
        onClick={() => goToStep('request')}
        className="w-full p-6 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors shrink-0">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-left flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Reset with OTP</h3>
            <p className="text-sm text-gray-500">
              Receive a one-time password on your email to verify your identity
            </p>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <Clock className="h-3 w-3 shrink-0" />
                <span>OTP expires in 10 minutes</span>
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <Shield className="h-3 w-3 shrink-0" />
                <span>Secure 6-digit verification code</span>
              </p>
            </div>
          </div>
        </div>
      </button>
    </div>
  );

  const renderRequestStep = () => (
    <div>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Mail className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Your Email</h2>
        <p className="text-gray-600">
          We'll send a verification code to your registered email address
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Admin Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@yourhotel.com"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isLoading}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitEmail()}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <Info className="h-3 w-3 shrink-0" />
          <span>If you have a recovery email set, the OTP will be sent there for extra security</span>
        </p>
      </div>

      <button
        onClick={handleSubmitEmail}
        disabled={isLoading || !adminEmail.trim()}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin shrink-0" />
            <span>Sending OTP...</span>
          </>
        ) : (
          <>
            <Mail className="h-5 w-5 shrink-0" />
            <span>Send OTP</span>
          </>
        )}
      </button>
    </div>
  );

  const renderVerifyStep = () => (
    <div>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Key className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter OTP</h2>
        <p className="text-gray-600 mb-2">
          Enter the 6-digit code sent to your email
        </p>
        {emailType && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full text-sm text-blue-700 mt-2 border border-blue-200">
            <Info className="h-4 w-4 shrink-0" />
            <span className="font-medium">
              Sent to {emailType === 'recovery' ? 'recovery email' : 'admin email'}
            </span>
          </div>
        )}
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {message}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
          Verification Code
        </label>
        <div className="flex justify-center gap-2">
          {otpInputs.map((digit, index) => (
            <input
              key={index}
              id={`otp-input-${index}`}
              type="text"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              maxLength={1}
              autoFocus={index === 0}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="h-4 w-4 shrink-0" />
          {countdown > 0 ? (
            <span className="font-mono font-bold">{formatTime(countdown)}</span>
          ) : (
            <span className="text-red-500">Expired</span>
          )}
        </div>
        <button
          onClick={handleResendOTP}
          disabled={countdown > 0 || isLoading}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 shrink-0 ${countdown > 0 ? '' : 'group-hover:rotate-180'}`} />
          <span>Resend OTP</span>
        </button>
      </div>

      <button
        onClick={handleVerifyOTP}
        disabled={otp.length !== 6 || isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin shrink-0" />
            <span>Verifying...</span>
          </>
        ) : (
          <>
            <Shield className="h-5 w-5 shrink-0" />
            <span>Verify OTP</span>
          </>
        )}
      </button>
    </div>
  );

  const renderChangeStep = () => (
    <div>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Lock className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h2>
        <p className="text-gray-600">
          Create a strong password to secure your account
        </p>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {message}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => updateNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showNewPassword ? <EyeOff className="h-5 w-5 shrink-0" /> : <Eye className="h-5 w-5 shrink-0" />}
            </button>
          </div>
          
          {newPassword && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Password strength:</span>
                <span className={`text-xs font-medium ${
                  passwordStrength <= 2 ? 'text-red-600' : 
                  passwordStrength <= 3 ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {getPasswordStrengthText()}
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
              </div>
              <div className="mt-2 space-y-1 text-xs text-gray-500">
                <p className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                  <CheckCircle className="h-3 w-3 shrink-0" />
                  <span>At least 8 characters</span>
                </p>
                <p className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                  <CheckCircle className="h-3 w-3 shrink-0" />
                  <span>Uppercase letter</span>
                </p>
                <p className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                  <CheckCircle className="h-3 w-3 shrink-0" />
                  <span>Lowercase letter</span>
                </p>
                <p className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                  <CheckCircle className="h-3 w-3 shrink-0" />
                  <span>Number</span>
                </p>
                <p className={`flex items-center gap-1 ${/[@$!%*?&]/.test(newPassword) ? 'text-green-600' : ''}`}>
                  <CheckCircle className="h-3 w-3 shrink-0" />
                  <span>Special character (@$!%*?&)</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => updateConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5 shrink-0" /> : <Eye className="h-5 w-5 shrink-0" />}
            </button>
          </div>
        </div>

        {confirmPassword && newPassword !== confirmPassword && (
          <div className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Passwords do not match</span>
          </div>
        )}
      </div>

      <button
        onClick={handleChangeWithOTP}
        disabled={
          !newPassword || 
          !confirmPassword || 
          newPassword !== confirmPassword || 
          newPassword.length < 8 || 
          passwordStrength < 4 || 
          isLoading
        }
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin shrink-0" />
            <span>Changing Password...</span>
          </>
        ) : (
          <>
            <Lock className="h-5 w-5 shrink-0" />
            <span>Change Password</span>
          </>
        )}
      </button>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
        <CheckCircle className="h-10 w-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Changed!</h2>
      <p className="text-gray-600 mb-8">
        Your password has been successfully updated.
      </p>
      <div className="flex justify-center mb-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
      <p className="text-sm text-gray-500">
        Redirecting to login...
      </p>
    </div>
  );

  const displayError = error || localError;

 return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="w-full max-w-md">
      {/* Back Button */}
      {step !== "select" && step !== "success" && (
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>
      )}

      {/* Error Message */}
      {displayError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 flex-1">{displayError}</p>
        </div>
      )}

      <div className="transition-all duration-300">
        {step === "select" && renderSelectStep()}
        {step === "request" && renderRequestStep()}
        {step === "verify" && renderVerifyStep()}
        {step === "change" && renderChangeStep()}
        {step === "success" && renderSuccessStep()}
      </div>
    </div>
  </div>
);
}