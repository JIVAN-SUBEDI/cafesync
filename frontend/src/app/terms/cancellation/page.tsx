// app/terms/cancellation/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  Tag, 
  CheckCircle,
  Loader2,
  Download,
  Printer,
  Share2,
  RefreshCw,
  Clock,
  CreditCard,
  FileText,
  Mail,
  Phone
} from 'lucide-react';
import { useTerms } from '@/hooks/useTerms';
import { format } from 'date-fns';

export default function CancellationPolicyPage() {
  const router = useRouter();
  const { cancellationPolicy, loading, error, refetch } = useTerms();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    refetch();
  }, []);

  const handlePrint = () => window.print();
  
  const handleDownload = () => {
    if (!cancellationPolicy) return;
    
    const content = `
      ${cancellationPolicy.title}
      Version: ${cancellationPolicy.version}
      Effective: ${format(new Date(cancellationPolicy.effective_from), 'MMMM dd, yyyy')}
      
      ${cancellationPolicy.content}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HotelEase-Cancellation-Policy-v${cancellationPolicy.version}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: cancellationPolicy?.title,
          text: `Check out HotelEase ${cancellationPolicy?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading cancellation policy...</p>
        </div>
      </div>
    );
  }

  if (error || !cancellationPolicy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cancellation Policy Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Unable to load cancellation policy. Please try again later.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="p-2 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Print"
              >
                <Printer className="h-5 w-5" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors relative"
                title="Share"
              >
                <Share2 className="h-5 w-5" />
                {copied && (
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Copied!
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-8 py-12 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{cancellationPolicy.title}</h1>
                  {cancellationPolicy.is_mandatory && (
                    <span className="px-3 py-1 bg-rose-600 rounded-full text-sm font-semibold">
                      Required
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6 text-white/80">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span>Version {cancellationPolicy.version}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Effective: {format(new Date(cancellationPolicy.effective_from), 'MMMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Policy Highlights */}
          <div className="p-8 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <Clock className="h-6 w-6 text-rose-500 mb-2" />
                <h3 className="font-semibold text-gray-900">Cancellation Window</h3>
                <p className="text-sm text-gray-600">Cancel within 14 days for full refund</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <RefreshCw className="h-6 w-6 text-rose-500 mb-2" />
                <h3 className="font-semibold text-gray-900">Free Trial</h3>
                <p className="text-sm text-gray-600">Cancel anytime during trial</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <CreditCard className="h-6 w-6 text-rose-500 mb-2" />
                <h3 className="font-semibold text-gray-900">Refund Processing</h3>
                <p className="text-sm text-gray-600">Refunds processed within 5-7 business days</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <FileText className="h-6 w-6 text-rose-500 mb-2" />
                <h3 className="font-semibold text-gray-900">No Hidden Fees</h3>
                <p className="text-sm text-gray-600">No cancellation fees</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Applies To Badge */}
            <div className="mb-8 flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                Applies to: {cancellationPolicy.applies_to === 'all' ? 'All Users' : cancellationPolicy.applies_to}
              </span>
              {cancellationPolicy.is_active ? (
                <span className="px-4 py-2 bg-green-100 rounded-lg text-sm font-medium text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Active
                </span>
              ) : (
                <span className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                  Inactive
                </span>
              )}
            </div>

            {/* Cancellation Policy Content */}
            <div className="prose prose-lg max-w-none">
              {cancellationPolicy.content.split('\n').map((paragraph, index) => {
                if (paragraph.trim() === '') return <br key={index} />;
                
                if (paragraph.startsWith('# ')) {
                  return <h1 key={index} className="text-3xl font-bold mt-8 mb-4 text-rose-600">{paragraph.substring(2)}</h1>;
                }
                if (paragraph.startsWith('## ')) {
                  return <h2 key={index} className="text-2xl font-bold mt-6 mb-3">{paragraph.substring(3)}</h2>;
                }
                if (paragraph.startsWith('### ')) {
                  return <h3 key={index} className="text-xl font-bold mt-4 mb-2">{paragraph.substring(4)}</h3>;
                }
                if (paragraph.match(/^[A-Z\s]+$/)) {
                  return <h3 key={index} className="text-xl font-bold mt-6 mb-3 text-rose-600">{paragraph}</h3>;
                }
                
                if (paragraph.startsWith('- ')) {
                  return (
                    <ul key={index} className="list-disc ml-6 mb-2">
                      <li>{paragraph.substring(2)}</li>
                    </ul>
                  );
                }
                if (paragraph.match(/^\d+\./)) {
                  return (
                    <ol key={index} className="list-decimal ml-6 mb-2">
                      <li>{paragraph.substring(paragraph.indexOf('.') + 1).trim()}</li>
                    </ol>
                  );
                }
                
                return <p key={index} className="mb-4 text-gray-700 leading-relaxed">{paragraph}</p>;
              })}
            </div>

            {/* Important Notes */}
            <div className="mt-12 p-6 bg-rose-50 rounded-xl border border-rose-200">
              <h3 className="text-lg font-bold text-rose-900 mb-4">📋 Important Notes</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
                  <span className="text-rose-800">Free trials automatically convert to paid subscriptions unless cancelled before the trial period ends.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
                  <span className="text-rose-800">Annual subscriptions are eligible for prorated refunds within the first 30 days.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
                  <span className="text-rose-800">Cancellation requests must be submitted through your account dashboard or via written notice to support.</span>
                </li>
              </ul>
            </div>

            {/* Contact for Cancellations */}
            <div className="mt-8 p-6 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📞 Need to Cancel?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-rose-600" />
                  <div>
                    <p className="text-sm text-gray-600">Email Cancellations</p>
                    <a href="mailto:cancellations@hotelease.com" className="text-rose-600 hover:underline font-medium">
                      cancellations@hotelease.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-rose-600" />
                  <div>
                    <p className="text-sm text-gray-600">Phone Support</p>
                    <a href="tel:+1234567890" className="text-rose-600 hover:underline font-medium">
                      +1 (234) 567-890
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-500">
                <div>
                  <p className="font-medium text-gray-700 mb-1">Document Information</p>
                  <p>Document ID: {cancellationPolicy.id}</p>
                  <p>Version: {cancellationPolicy.version}</p>
                  <p>Created: {format(new Date(cancellationPolicy.created_at), 'MMMM dd, yyyy')}</p>
                  {cancellationPolicy.updated_at !== cancellationPolicy.created_at && (
                    <p>Last Updated: {format(new Date(cancellationPolicy.updated_at), 'MMMM dd, yyyy')}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-1">Effective Period</p>
                  <p>From: {format(new Date(cancellationPolicy.effective_from), 'MMMM dd, yyyy')}</p>
                  {cancellationPolicy.effective_until && (
                    <p>Until: {format(new Date(cancellationPolicy.effective_until), 'MMMM dd, yyyy')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}