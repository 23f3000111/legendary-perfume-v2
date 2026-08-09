import Hero from '../sections/Hero'
import CounterBar from '../sections/CounterBar'
import Signature from '../sections/Signature'
import CollectionsRail from '../sections/CollectionsRail'
import ScentMemory from '../sections/ScentMemory'
import Finder from '../sections/Finder'
import Bestsellers from '../sections/Bestsellers'
import Gifting from '../sections/Gifting'
import FeaturedIn from '../sections/FeaturedIn'
import Reviews from '../sections/Reviews'

/**
 * Client note: the Our Story block and the company attributes strip have both
 * moved off the home page — Our Story already has its own nav entry, and the
 * attributes now sit under the Our Story page's opening section.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <CounterBar />
      <Signature />
      <CollectionsRail />
      <ScentMemory />
      <Bestsellers />
      <Finder />
      <Gifting />
      <FeaturedIn />
      <Reviews />
    </>
  )
}
