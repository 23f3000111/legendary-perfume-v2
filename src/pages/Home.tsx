import Hero from '../sections/Hero'
import Signature from '../sections/Signature'
import CollectionsRail from '../sections/CollectionsRail'
import ScentMemory from '../sections/ScentMemory'
import Finder from '../sections/Finder'
import Bestsellers from '../sections/Bestsellers'
import Gifting from '../sections/Gifting'
import Heritage from '../sections/Heritage'
import Services from '../sections/Services'
import FeaturedIn from '../sections/FeaturedIn'
import Reviews from '../sections/Reviews'

export default function Home() {
  return (
    <>
      <Hero />
      <Signature />
      <CollectionsRail />
      <ScentMemory />
      <Bestsellers />
      <Finder />
      <Gifting />
      <Heritage />
      {/* "As Featured In" sits directly before the customer reviews */}
      <FeaturedIn />
      <Reviews />
      <Services />
    </>
  )
}
