import React, { useState, useCallback, useRef } from 'react'
import ImageIngestionVisualizer from './visualizers/ImageIngestionVisualizer.jsx'

const ALLOWED_TYPES = ['image/png', 'image/jpeg']
const MAX_SIZE_MB = 20

export default function UploadStep({ onFileSelected, selectedFile, imagePreview, onContinue }) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const validateAndSet = useCallback((file) => {
    setError(null)
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a PNG or JPG image.')
      return
    }
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > MAX_SIZE_MB) {
      setError(`File is too large (${sizeMB.toFixed(1)} MB). Maximum is ${MAX_SIZE_MB} MB.`)
      return
    }
    onFileSelected(file)
  }, [onFileSelected])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    validateAndSet(file)
  }, [validateAndSet])

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)

  const handleInputChange = (e) => {
    validateAndSet(e.target.files[0])
  }

  const handleZoneClick = () => {
    if (!selectedFile) inputRef.current?.click()
  }

  const fileSizeMB = selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : null

  if (selectedFile && imagePreview) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <p className="section-heading">Selected Image</p>
          <div style={{
            display: 'flex',
            gap: 20,
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
          }}>
            <img
              src={imagePreview}
              alt="Selected"
              style={{
                maxWidth: 220,
                maxHeight: 160,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                objectFit: 'contain',
              }}
            />
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontWeight: 600, marginBottom: 6, wordBreak: 'break-all' }}>
                {selectedFile.name}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {fileSizeMB} MB
              </div>
              <ImageDimensions file={selectedFile} />
            </div>
          </div>

          {/* Scientific Image Ingestion & Matrix Breakdown */}
          <ImageIngestionVisualizer file={selectedFile} previewUrl={imagePreview} />
        </div>
        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => {
            onFileSelected(null)
            setError(null)
          }}>
            Change Image
          </button>
          <button className="btn btn-primary" onClick={onContinue}>
            Continue →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7 }}>
        Explore how BB84 quantum key distribution can establish shared key material
        for secure image transfer. The image is encrypted with AES-GCM using a key
        derived from the quantum channel — not transmitted through it.
      </p>

      <p className="section-heading">Upload an Image</p>

      <div
        className={`upload-zone${dragOver ? ' drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleZoneClick}
        role="button"
        tabIndex={0}
        aria-label="Upload image — drop here or click to browse"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleZoneClick() }}
      >
        <div className="upload-zone-icon">⬆</div>
        <p>Drop image here</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>or <span style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>Browse files</span></p>
        <p className="hint" style={{ marginTop: 8 }}>PNG · JPG · JPEG — up to {MAX_SIZE_MB} MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          style={{ display: 'none' }}
          onChange={handleInputChange}
          aria-hidden="true"
        />
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}
    </div>
  )
}

function ImageDimensions({ file }) {
  const [dims, setDims] = useState(null)
  React.useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      setDims({ w: img.naturalWidth, h: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [file])
  if (!dims) return null
  return (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
      {dims.w} × {dims.h}
    </div>
  )
}
