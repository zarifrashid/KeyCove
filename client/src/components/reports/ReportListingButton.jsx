import { useState } from 'react'
import ReportListingModal from './ReportListingModal'

export default function ReportListingButton({ property }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className="danger-outline-btn" onClick={() => setOpen(true)}>
        Report Listing
      </button>
      {open ? <ReportListingModal property={property} onClose={() => setOpen(false)} /> : null}
    </>
  )
}
