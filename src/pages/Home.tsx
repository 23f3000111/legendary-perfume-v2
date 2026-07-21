import Hero from '../sections/Hero'
import NotesMarquee from '../sections/NotesMarquee'
import Signature from '../sections/Signature'
import CollectionsRail from '../sections/CollectionsRail'
import ScentMemory from '../sections/ScentMemory'
import Finder from '../sections/Finder'
import Bestsellers from '../sections/Bestsellers'
import Gifting from '../sections/Gifting'
import Heritage from '../sections/Heritage'
import Services from '../sections/Services'
import JournalPreview from '../sections/JournalPreview'

export default function Home() {
  return (
    <>
      <Hero />
      <NotesMarquee />
      <Signature />
      <CollectionsRail />
      <ScentMemory />
      <Bestsellers />
      <Finder />
      <Gifting />
      <Heritage />
      <JournalPreview />
      <Services />
    </>
  )
}
