import { ImageResponse } from 'next/og'

// Code-generated share image in brand colours — replace with real
// photography-based OG art when available.
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Teenpreneurs — EveryOne is able, differently.'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#101E3C',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 44, fontWeight: 700 }}>
          Teen<span style={{ color: '#FF5A48' }}>preneurs</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 980 }}>
            In 12 weeks, your teen launches something real.
          </div>
          <div style={{ display: 'flex', fontSize: 36, color: '#FFC94D', fontStyle: 'italic' }}>
            EveryOne is able, differently.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 120, height: 12, background: '#FF5A48', borderRadius: 6 }} />
          <div style={{ width: 120, height: 12, background: '#2EA6FF', borderRadius: 6 }} />
          <div style={{ width: 120, height: 12, background: '#FFC94D', borderRadius: 6 }} />
        </div>
      </div>
    ),
    size
  )
}
