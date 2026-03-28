import Navbar from '../components/Navbar'
import RecommendationSection from '../components/recommendations/RecommendationSection'

export default function RecommendationsPage() {
  return (
    <>
      <Navbar />
      <div className="page-wrap recommendation-page-wrap">
        <RecommendationSection />
      </div>
    </>
  )
}
