import Hero from '../sections/Hero'
import Signature from '../sections/Signature'
import CollectionsRail from '../sections/CollectionsRail'
import ScentMemory from '../sections/ScentMemory'
import Finder from '../sections/Finder'
import Bestsellers from '../sections/Bestsellers'
import PartneredWith from '../sections/PartneredWith'
import Reviews from '../sections/Reviews'

/**
 * Client note: the Our Story block and the company attributes strip have both
 * moved off the home page. Our Story already has its own nav entry, and the
 * attributes now sit under the Our Story page's opening section.
 *
 * Revision 2 removes two more blocks at the client's request: the Est. 2015
 * counter strip under the hero, and the Art of Gifting split.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Signature />
      <CollectionsRail />
      <ScentMemory />
      <Bestsellers />
      <Finder />
      <PartneredWith />
      <Reviews />
    </>
  )
}
