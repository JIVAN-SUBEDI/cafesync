// app/terms/platform/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  ArrowLeft, 
  Calendar, 
  Tag, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Printer,
  Share2
} from 'lucide-react';
import { useTerms } from '@/hooks/useTerms';
import { format } from 'date-fns';

export default function PlatformTermsPage() {
  const router = useRouter();
  const { platformTerms, loading, error, refetch } = useTerms();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    refetch();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!platformTerms) return;
    
    const content = `
      ${platformTerms.title}
      Version: ${platformTerms.version}
      Effective: ${format(new Date(platformTerms.effective_from), 'MMMM dd, yyyy')}
      
      ${platformTerms.content}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HotelEase-Terms-of-Service-v${platformTerms.version}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: platformTerms?.title,
          text: `Check out HotelEase ${platformTerms?.title}`,
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading terms and conditions...</p>
        </div>
      </div>
    );
  }

  if (error || !platformTerms) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Terms Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Unable to load terms and conditions. Please try again later.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="Print"
              >
                <Printer className="h-5 w-5" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors relative"
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
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-12 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{platformTerms.title}</h1>
                  {platformTerms.is_mandatory && (
                    <span className="px-3 py-1 bg-amber-600 rounded-full text-sm font-semibold">
                      Required
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6 text-white/80">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span>Version {platformTerms.version}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Effective: {format(new Date(platformTerms.effective_from), 'MMMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Applies To Badge */}
            <div className="mb-8 flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                Applies to: {platformTerms.applies_to === 'all' ? 'All Users' : platformTerms.applies_to}
              </span>
              {platformTerms.is_active ? (
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

            {/* Terms Content */}
            <div className="prose prose-lg max-w-none">
              {platformTerms.content.split('\n').map((paragraph, index) => {
                if (paragraph.trim() === '') return <br key={index} />;
                
                // Check if it's a heading (starts with # or is all caps)
                if (paragraph.startsWith('# ')) {
                  return <h1 key={index} className="text-3xl font-bold mt-8 mb-4">{paragraph.substring(2)}</h1>;
                }
                if (paragraph.startsWith('## ')) {
                  return <h2 key={index} className="text-2xl font-bold mt-6 mb-3">{paragraph.substring(3)}</h2>;
                }
                if (paragraph.startsWith('### ')) {
                  return <h3 key={index} className="text-xl font-bold mt-4 mb-2">{paragraph.substring(4)}</h3>;
                }
                if (paragraph.match(/^[A-Z\s]+$/)) {
                  return <h3 key={index} className="text-xl font-bold mt-6 mb-3 text-amber-600">{paragraph}</h3>;
                }
                
                // Check if it's a list item
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
                
                // Regular paragraph
                return <p key={index} className="mb-4 text-gray-700 leading-relaxed">{paragraph}</p>;
              })}
            </div>

            {/* Footer Info */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-500">
                <div>
                  <p className="font-medium text-gray-700 mb-1">Document Information</p>
                  <p>Document ID: {platformTerms.id}</p>
                  <p>Version: {platformTerms.version}</p>
                  <p>Created: {format(new Date(platformTerms.created_at), 'MMMM dd, yyyy')}</p>
                  {platformTerms.updated_at !== platformTerms.created_at && (
                    <p>Last Updated: {format(new Date(platformTerms.updated_at), 'MMMM dd, yyyy')}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-1">Effective Period</p>
                  <p>From: {format(new Date(platformTerms.effective_from), 'MMMM dd, yyyy')}</p>
                  {platformTerms.effective_until && (
                    <p>Until: {format(new Date(platformTerms.effective_until), 'MMMM dd, yyyy')}</p>
                  )}
                  {platformTerms.created_by_name && (
                    <p className="mt-2">Created by: {platformTerms.created_by_name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Acceptance CTA */}
            <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-amber-800 mb-4">
                By using HotelEase, you agree to these terms and conditions. If you have any questions, please contact our support team.
              </p>
              <button
                onClick={() => router.push('/register')}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Accept Terms & Continue
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}