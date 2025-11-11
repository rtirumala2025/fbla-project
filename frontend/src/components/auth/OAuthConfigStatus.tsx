import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { validateSupabaseOAuth, ValidationResult } from '../../utils/validateSupabaseOAuth';

export const OAuthConfigStatus = () => {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const runValidation = async () => {
      const result = await validateSupabaseOAuth();
      setValidation(result);
      
      // Auto-expand if there are errors
      if (!result.isValid) {
        setIsExpanded(true);
      }
    };

    runValidation();
  }, []);

  if (!validation) return null;

  // Don't show if everything is valid
  if (validation.isValid && validation.warnings.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-pet text-left hover:bg-yellow-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {validation.isValid ? (
            <Info className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <span className="font-semibold text-gray-900">
            {validation.isValid 
              ? 'Configuration Warnings Detected' 
              : 'Configuration Issues Detected'}
          </span>
        </div>
        <span className="text-sm text-gray-600">
          {isExpanded ? 'Hide' : 'Show'} Details
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 p-4 bg-white border border-gray-200 rounded-pet space-y-4">
          {validation.errors.length > 0 && (
            <div>
              <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Errors
              </h4>
              <ul className="space-y-1 text-sm">
                {validation.errors.map((error, i) => (
                  <li key={i} className="text-red-700 pl-6">• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div>
              <h4 className="font-semibold text-yellow-600 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Warnings
              </h4>
              <ul className="space-y-1 text-sm">
                {validation.warnings.map((warning, i) => (
                  <li key={i} className="text-yellow-700 pl-6">• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Quick Fix:</strong>
            </p>
            <ol className="text-sm text-gray-700 space-y-1 pl-5 list-decimal">
              <li>Check browser console (F12) for detailed validation output</li>
              <li>Verify <code className="bg-gray-100 px-1 rounded">REACT_APP_USE_MOCK=false</code> in <code className="bg-gray-100 px-1 rounded">.env</code></li>
              <li>Enable Google OAuth in Supabase Dashboard</li>
              <li>Add redirect URLs to Supabase configuration</li>
              <li>Restart dev server after changes</li>
            </ol>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              See console for complete setup checklist and troubleshooting steps.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

