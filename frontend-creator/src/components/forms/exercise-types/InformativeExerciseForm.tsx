import React from 'react';
import { useTranslation } from 'react-i18next';

interface InformativeExerciseFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: any;
}

export const InformativeExerciseForm: React.FC<InformativeExerciseFormProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { t } = useTranslation();

  const handleMediaChange = (field: string, value: any) => {
    const media = { ...(data.media || {}), [field]: value };
    onChange('media', media);
  };

  const handleRemoveMedia = () => {
    onChange('media', undefined);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          {t('creator.forms.exercise.title', 'Title')}
          <span className="text-error ml-1">*</span>
        </label>
        <input
          type="text"
          id="title"
          className="input w-full"
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder={t(
            'creator.forms.exercise.titlePlaceholder',
            'Enter informative content title'
          )}
        />
        {errors?.title && (
          <p className="mt-1 text-sm text-error">{errors.title}</p>
        )}
      </div>

      {/* Content */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          {t('creator.forms.exercise.content', 'Content')}
          <span className="text-error ml-1">*</span>
        </label>
        <textarea
          id="content"
          className="input w-full min-h-[120px]"
          value={data.content || ''}
          onChange={(e) => onChange('content', e.target.value)}
          placeholder={t(
            'creator.forms.exercise.contentPlaceholder',
            'Enter the informative content'
          )}
        />
        {errors?.content && (
          <p className="mt-1 text-sm text-error">{errors.content}</p>
        )}
      </div>

      {/* Media */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('creator.forms.exercise.media', 'Media (Optional)')}
        </label>

        {data.media ? (
          <div className="p-4 border border-neutral-200 rounded-lg bg-neutral-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">
                {t('creator.forms.exercise.mediaConfiguration', 'Media Configuration')}
              </h4>
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="text-error hover:text-error-dark text-sm"
              >
                {t('common.buttons.remove', 'Remove')}
              </button>
            </div>

            <div className="space-y-3">
              {/* Media Type */}
              <div>
                <label
                  htmlFor="mediaType"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  {t('creator.forms.exercise.mediaType', 'Media Type')}
                </label>
                <select
                  id="mediaType"
                  className="input w-full"
                  value={data.media.type || 'image'}
                  onChange={(e) => handleMediaChange('type', e.target.value)}
                >
                  <option value="image">
                    {t('creator.forms.exercise.image', 'Image')}
                  </option>
                  <option value="video">
                    {t('creator.forms.exercise.video', 'Video')}
                  </option>
                  <option value="audio">
                    {t('creator.forms.exercise.audio', 'Audio')}
                  </option>
                </select>
              </div>

              {/* Media URL */}
              <div>
                <label
                  htmlFor="mediaUrl"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  {t('creator.forms.exercise.mediaUrl', 'Media URL')}
                </label>
                <input
                  type="url"
                  id="mediaUrl"
                  className="input w-full"
                  value={data.media.url || ''}
                  onChange={(e) => handleMediaChange('url', e.target.value)}
                  placeholder={t(
                    'creator.forms.exercise.mediaUrlPlaceholder',
                    'Enter media URL'
                  )}
                />
              </div>

              {/* Alt Text (for images) */}
              {data.media.type === 'image' && (
                <div>
                  <label
                    htmlFor="mediaAlt"
                    className="block text-sm font-medium text-neutral-700 mb-1"
                  >
                    {t('creator.forms.exercise.altText', 'Alt Text')}
                  </label>
                  <input
                    type="text"
                    id="mediaAlt"
                    className="input w-full"
                    value={data.media.alt || ''}
                    onChange={(e) => handleMediaChange('alt', e.target.value)}
                    placeholder={t(
                      'creator.forms.exercise.altTextPlaceholder',
                      'Describe the image for accessibility'
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-neutral-300 rounded-lg">
            <p className="text-neutral-500 mb-3">
              {t('creator.forms.exercise.noMedia', 'No media attached')}
            </p>
            <button
              type="button"
              onClick={() => handleMediaChange('type', 'image')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {t('creator.forms.exercise.addMedia', 'Add Media')}
            </button>
          </div>
        )}

        {errors?.media && (
          <p className="mt-1 text-sm text-error">{errors.media}</p>
        )}
      </div>
    </div>
  );
};

export default InformativeExerciseForm;