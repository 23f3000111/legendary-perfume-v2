import Hero from '../sections/Hero'
import Signature from '../sections/Signature'
import CollectionsRail from '../sections/CollectionsRail'
import ScentMemory from '../sections/ScentMemory'
import Finder from '../sections/Finder'
import Bestsellers from '../sections/Bestsellers'
import PartneredWith from '../sections/PartneredWith'
import Reviews from '../sections/Reviews'
import Seo from '../components/Seo'

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
      <Seo
        title="Legendary"
        description="Legendary is a Malaysian perfume house founded in 2015, bottling the botanical heritage and soul of Malaysia. Shop eau de parfum for her, for him and gift sets, with free delivery across Malaysia."
        image="/assets/client/banner-fragrances.webp"
        canonicalPath="/"
      />
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
