'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { UploadCloud } from 'lucide-react'

import { hasStorage } from '@/lib/amplify'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { EmptyState } from '@/components/ui/states'

type Uploaded = { path: string; name: string }

/** Uploads to S3 with a live progress bar and reports the resulting key. */
export function MediaUploader() {
  const t = useTranslations('admin')
  const tc = useTranslations('common')

  const [prefix, setPrefix] = useState('public/videos/')
  const [file, setFile] = useState<File | null>(null)
  const [percent, setPercent] = useState<number | null>(null)
  const [uploaded, setUploaded] = useState<Uploaded[]>([])

  async function upload() {
    if (!file) return
    const path = `${prefix.replace(/\/*$/, '/')}${file.name.replace(/\s+/g, '-')}`
    setPercent(0)

    try {
      const { uploadData } = await import('aws-amplify/storage')
      await uploadData({
        path,
        data: file,
        options: {
          contentType: file.type || 'application/octet-stream',
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes) setPercent(Math.round((transferredBytes / totalBytes) * 100))
          },
        },
      }).result

      setUploaded((u) => [{ path, name: file.name }, ...u])
      setFile(null)
      toast.success(t('uploadDone'))
    } catch (err) {
      console.error('[admin] upload failed', err)
      toast.error(tc('error'))
    } finally {
      setPercent(null)
    }
  }

  if (!hasStorage) return <EmptyState title={t('uploadTitle')} body={t('uploadHint')} />

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <h3 className="text-lg font-bold">{t('uploadTitle')}</h3>
      <p className="text-muted text-sm">{t('uploadHint')}</p>

      <Field label="S3 prefix" htmlFor="upload-prefix">
        <Input
          id="upload-prefix"
          dir="ltr"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
        />
      </Field>

      <Field label={t('media')} htmlFor="upload-file">
        <Input
          id="upload-file"
          type="file"
          accept="video/*,image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </Field>

      {percent !== null ? (
        <div aria-live="polite">
          <div className="bg-surface h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-[width]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="ltr-nums text-muted mt-1 text-xs">{t('uploading', { percent })}</p>
        </div>
      ) : null}

      <Button onClick={upload} disabled={!file || percent !== null} className="self-start">
        <UploadCloud className="size-4" aria-hidden />
        {tc('save')}
      </Button>

      {uploaded.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {uploaded.map((u) => (
            <li key={u.path} className="ltr-nums bg-surface truncate rounded-lg px-3 py-2">
              {u.path}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
