'use client';

import { useState, useEffect } from 'react';
import promotionalEmailService from '@/services/promotional-email.service';
import { EmailCampaignTemplate } from '@/types/promotional-email.types';
import { useAlert } from '@/hooks/useAlert';
import { AlertCircle, Copy, Check } from 'lucide-react';

export default function EmailTemplatesPage() {
  const { showAlert } = useAlert();
  const [templates, setTemplates] = useState<EmailCampaignTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await promotionalEmailService.getTemplates();
      setTemplates(response.templates);
    } catch (error) {
      showAlert('Failed to load templates', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const apiExampleJson = {
    name: 'Welcome Email',
    slug: 'welcome-email',
    description: 'Welcome new users to Acceding Titans',
    email_type: 'promotional',
    required_fields: ['subject', 'content', 'call_to_action'],
    optional_fields: ['image_url', 'footer_text'],
    field_descriptions: {
      subject: 'Email subject line',
      content: 'Main email content',
      call_to_action: 'CTA button text',
    },
    category: 'general',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
        <p className="text-gray-600 mt-2">
          Manage email templates used for promotional campaigns
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          How to Create Templates
        </h2>
        <div className="text-sm text-blue-800 space-y-3">
          <p>
            Templates are created via backend API. Use the following endpoint to create new templates:
          </p>
          <div className="bg-white rounded p-3 font-mono text-xs overflow-x-auto">
            POST /admin/promotional-emails/templates
          </div>

          <p className="font-semibold mt-4">Example Request Body:</p>
          <div className="bg-white rounded p-4 font-mono text-xs overflow-x-auto relative">
            <pre>{JSON.stringify(apiExampleJson, null, 2)}</pre>
            <button
              onClick={() => copyToClipboard(JSON.stringify(apiExampleJson, null, 2), 0)}
              className="absolute top-2 right-2 p-2 bg-gray-100 hover:bg-gray-200 rounded transition"
              title="Copy"
            >
              {copiedId === 0 ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="font-semibold mb-2">Required Fields:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>required_fields</strong>: Array of field names required to fill when creating
                campaigns
              </li>
              <li>
                <strong>optional_fields</strong>: Array of optional field names
              </li>
              <li>
                <strong>field_descriptions</strong>: Object describing each field
              </li>
              <li>
                <strong>category</strong>: One of: general, referral, loyalty, reward, event
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Available Templates ({templates.length})
        </h2>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <p className="text-yellow-800 text-lg">
              No templates created yet. Create one using the API endpoint above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{template.name}</h3>
                  <span className="text-xs font-semibold uppercase px-2 py-1 bg-[#620707]/10 text-[#620707] rounded">
                    {template.category}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Required Fields</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.required_fields.map((field) => (
                        <span
                          key={field}
                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>

                  {template.optional_fields.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Optional Fields</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.optional_fields.map((field) => (
                          <span
                            key={field}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 pt-3 border-t border-gray-200">
                  <p>Used {template.usage_count} times</p>
                  <p>Created: {new Date(template.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
