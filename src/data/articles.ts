import { asset } from '../lib/asset'
import type { Block } from '../components/ui/Prose'

/* ------------------------------------------------------------------
   The Journal. Four long-form articles carried over from the client's
   live site, re-set in the house typography. Bodies are Block[] so the
   Prose renderer owns every type decision — see components/ui/Prose.
   ------------------------------------------------------------------ */

export interface Article {
  slug: string
  title: string
  /** Shorter title for cards and the previous / next rail. */
  cardTitle?: string
  category: string
  /** Published date, already formatted for display. */
  date: string
  readTime: string
  excerpt: string
  hero: string
  /** Alt text for the hero image. */
  heroAlt: string
  body: Block[]
}

const blog = (name: string) => asset(`/Journal_Images/${name}`)

export const articles: Article[] = [
  /* ---------------------------------------------------------------- */
  {
    slug: 'nyonya-collection-heritage-to-legendary',
    title: 'Nyonya Collection: From Heritage to Legendary Perfume',
    cardTitle: 'Nyonya Collection: From Heritage to Legendary',
    category: 'Heritage',
    date: '31 December 2025',
    readTime: '5 min',
    excerpt:
      'Inside the Peranakan culture that shaped the Nyonya Collection, and how a heritage of tiles, kebaya and kuih became three wearable Malaysian fragrances.',
    hero: asset('/assets/client/collection-nyonya.webp'),
    heroAlt: 'The three Nyonya Collection bottles beside their Peranakan-patterned boxes',
    body: [
      {
        t: 'lead',
        text: 'Malaysia is a land rich in culture, stories and traditions — and few heritages are as elegant or as distinctive as Nyonya (Peranakan) culture. Inspired by that timeless legacy, Legendary presents the [Nyonya Collection](/shop?collection=nyonya), a series of fragrances that turns cultural beauty into a modern Malaysian perfume experience.',
      },
      {
        t: 'p',
        text: 'More than a scent, the Nyonya Collection celebrates identity, femininity and craftsmanship — which is what makes it a meaningful Malaysian souvenir and a must-buy for visitors and fragrance lovers alike.',
      },
      { t: 'h2', text: 'The beauty of Nyonya culture as fragrance inspiration' },
      {
        t: 'p',
        text: 'Nyonya culture is renowned for its refinement, its attention to detail and its graceful balance between tradition and modernity. From the intricately embroidered kebaya to pastel-hued porcelain and floral motifs, every element tells a story of elegance passed down through generations.',
      },
      {
        t: 'p',
        text: 'That philosophy forms the heart of the collection. Each fragrance is composed to capture graceful femininity, cultural depth and timeless beauty, blending tradition with a contemporary lifestyle. Just as Nyonya craftsmanship values patience and artistry, every perfume here is curated to feel personal, elegant and enduring.',
      },
      {
        t: 'image',
        src: asset('/assets/nyonya-heritage-house.webp'),
        alt: 'A Peranakan shophouse façade, tiled and shuttered',
        caption: 'The shophouse tilework of Melaka — the collection’s first reference point.',
      },
      { t: 'h2', text: 'From cultural heritage to Legendary perfume' },
      {
        t: 'p',
        text: 'The journey from Nyonya inspiration to a finished bottle begins with storytelling. Rather than following global fragrance trends, we work the other way around: preserving local narratives through scent. Floral accords, soft musks and refined notes are blended to evoke warmth, elegance and nostalgia — qualities long associated with Nyonya heritage.',
      },
      {
        t: 'p',
        text: 'Each bottle is a tribute to Malaysian heritage, a wearable memory of culture, and a scent that travels well beyond its borders.',
      },
      { t: 'h2', text: 'A Malaysian must-buy for tourists and locals' },
      {
        t: 'p',
        text: 'The Nyonya Collection has become a favourite among international visitors searching for a meaningful souvenir. Unlike a typical gift, perfume offers something deeply personal — a scent that carries memories of Malaysia with every spray. Visitors from China, Indonesia, Korea, Japan, the Arab countries and Europe are drawn to it for its cultural storytelling, elegant presentation and universal appeal. For locals, it is a proud expression of Malaysian identity: a reminder that heritage can stand beautifully on the global stage.',
      },
      { t: 'h2', text: 'Where tradition meets a modern Malaysian perfume' },
      {
        t: 'p',
        text: 'What makes the collection special is its ability to bridge generations. It resonates with those who appreciate heritage while appealing to modern fragrance lovers who want elegance, subtlety and sophistication. Worn daily or reserved for occasions, these perfumes reflect confidence with softness, strength with grace, and tradition with modern expression.',
      },
      { t: 'h2', text: 'Why the Nyonya Collection belongs in yours' },
      {
        t: 'p',
        text: 'For anyone seeking a meaningful Malaysian perfume, a culturally inspired souvenir or a refined gift, the Nyonya Collection is the natural choice. It is more than fragrance: it is a story, a memory, and a tribute to the beauty of Malaysian heritage.',
      },
      {
        t: 'quote',
        text: 'Heritage becomes fragrance — and fragrance travels further than any keepsake.',
      },
      { t: 'h2', text: 'Experience the collection' },
      {
        t: 'ul',
        items: [
          'Discover the three scents — [Kebaya Blooms](/product/kebaya-blooms), [Ondeh Delights](/product/ondeh-delights) and [Nyonya Aromatic](/product/nyonya-aromatic) — online or at any Legendary counter nationwide.',
          'Find your nearest boutique on the [Store Locator](/stores).',
          'Let tradition inspire your scent, and carry a piece of Malaysia wherever you go.',
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: 'benefits-of-alcohol-free-perfumes',
    title: 'Benefits of Alcohol-Free Perfumes',
    category: 'Science',
    date: '17 November 2025',
    readTime: '6 min',
    excerpt:
      'How nanoemulsion technology replaced ethanol, and why an oil-based fragrance sits gentler on the skin and lasts several times longer in a tropical climate.',
    hero: blog('alcohol-free-perfumes.webp'),
    heroAlt: 'Three alcohol-free rollerball bottles beside the 3 Wishes box, lit through a curtain',
    body: [
      {
        t: 'lead',
        text: 'Alcohol-free perfumes are becoming increasingly popular among fragrance lovers looking for gentle, skin-friendly options. Unlike traditional alcohol-based sprays, which often open with a sharp, immediate burst, alcohol-free fragrances deliver a smoother, softer introduction that settles elegantly across the day.',
      },
      {
        t: 'p',
        text: 'This guide covers how alcohol-free perfumes are made, the science behind the benefits, and why they are quickly becoming a preferred choice.',
      },
      { t: 'h2', text: 'How are alcohol-free perfumes made?' },
      {
        t: 'p',
        text: 'They are formulated using nanotechnology — specifically, **nanoemulsion systems**. Instead of relying on ethanol, fragrance oils are broken down into ultra-fine droplets (1–100 nanometres) using emulsification. Those droplets stay suspended in a water-based formulation, creating perfumes that are stable, lightweight and gentle on the skin.',
      },
      { t: 'h2', text: '01 — Gentler on skin' },
      {
        t: 'p',
        text: 'Alcohol evaporates rapidly on contact with the skin, which can strip away moisture and weaken the skin barrier. For people with sensitive or reactive skin, that may show up as dryness, irritation or discomfort (Sikora et al., 2018).',
      },
      {
        t: 'p',
        text: 'Alcohol-free perfumes avoid this by using oils and gentle carriers that do not trigger the drying effect. Many of the oils used — jojoba, coconut and argan among them — contain fatty acids that support the skin’s natural lipid barrier, improving moisture retention and overall comfort (Lin et al., 2017).',
      },
      { t: 'h2', text: '02 — Longer scent longevity' },
      {
        t: 'p',
        text: 'Because ethanol evaporates quickly, it carries fragrance molecules off with it, leading to a faster fade. Oil and emulsion bases evaporate far more slowly, letting the fragrance linger. Sikora et al. (2018) report that oil-based perfumes can last around 6–15 hours, while alcohol-based ones last about 3.',
      },
      { t: 'p', text: 'Dallay et al. (2023) explain the mechanism:' },
      {
        t: 'quote',
        text: 'In an O/W (oil in water) emulsion, fragrance molecules dissolved in the aqueous phase are expected to be released faster than those dissolved in the oil phase.',
        cite: 'Dallay et al., International Journal of Cosmetic Science, 2023',
      },
      {
        t: 'p',
        text: 'In simpler words: alcohol-free and oil-based perfumes naturally retain scent longer because the molecules are held and released gradually.',
      },
      { t: 'h2', text: '03 — A different sensory delivery' },
      {
        t: 'p',
        text: 'How a perfume opens, develops and settles depends heavily on evaporation rate and carrier system. Oil- and emulsion-based perfumes have lower volatility, so fragrance molecules evaporate more slowly and more gently than in alcohol-based formulations.',
      },
      {
        t: 'p',
        text: 'That slower diffusion creates a different scent progression. Academic studies such as Binks et al. (2010) and Gunawan et al. (2023) show that emulsions and nanoemulsions reduce the evaporation rate of volatile fragrance compounds, resulting in:',
      },
      {
        t: 'ul',
        items: [
          'A subtle, refined release of top notes.',
          'A smoother transition into middle and base notes.',
        ],
      },
      {
        t: 'p',
        text: 'Because oil and emulsion carriers release fragrance molecules gradually, the scent evolves more softly and remains on the skin longer. The result is a sensory profile that feels more intimate and more extended than the sharper, faster progression of an alcohol-based perfume (Dallay et al., 2023).',
      },
      { t: 'h2', text: 'Conclusion' },
      {
        t: 'p',
        text: 'Alcohol-free perfumes offer a gentler, longer-lasting and more skin-friendly alternative to traditional alcohol-based scents. Supported by research and advanced nanoemulsion technology, they provide smoother diffusion, better comfort in warm climates like Malaysia’s, and a more refined scent progression. Whether you have sensitive skin or simply prefer a soft, intimate fragrance that lasts, alcohol-free perfumes are a modern, clean and highly wearable option for every day.',
      },
      {
        t: 'tip',
        text: 'Our [3 Wishes](/product/3-wishes) rollerball trio is alcohol-free and sized for carry-on — the easiest way to test the difference on your own skin.',
      },
      { t: 'h3', text: 'References' },
      {
        t: 'refs',
        items: [
          'Binks B.P., Fletcher, P. D., Holt, B. L., and Beaussaoubre, P. (2010). Selective Retardation of Perfume Oil Evaporation from Oil-in-Water Emulsions Stabilized by Either Surfactant or Nanoparticles. Langmuir, 26(23). DOI:10.1021/la103700g',
          'Dallay, C., Malhiac, C., Picard, C., and Savary, G. (2023). Fragrance in dermocosmetics emulsions: From microstructure to skin application. International Journal of Cosmetic Science, 46(1), 1–23. https://doi.org/10.1111/ics.12896',
          'Gunawan, I., Daryono, B. S., Noviana, E. and Sulaiman, T. N. S. (2023). Nano-Perfumes as a Fragrance Carrier: Their Brief History, Essential Aspects, Development, Preparation Methods, Characteristics, and Future Perspectives. Indonesian Journal of Pharmacy, 34(3), 395–418.',
          'Sikora, E., Małgorzata, M., Kennard, K. W. and Lason, E. (2018). Nanoemulsions as a Form of Perfumery Products. Cosmetics 2018, 5(4), 63. https://doi.org/10.3390/cosmetics5040063',
          'Yammine, J., Chihib, NE., Gharsallaoui, A., Ismail, A. and Karam, L. (2023). Advances in essential oils encapsulation: development, characterization and release mechanisms. Polymer Bulletin, 81, 3837–3882. https://doi.org/10.1007/s00289-023-04916-0',
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: 'perfume-longevity-secrets',
    title: 'Perfume Longevity Secrets Every Fragrance Lover Should Know',
    cardTitle: 'Perfume Longevity Secrets',
    category: 'Rituals',
    date: '22 August 2025',
    readTime: '9 min',
    excerpt:
      'Five expert-backed habits — hydration, placement, chemistry, storage and layering — that decide whether your fragrance lasts three hours or all day.',
    hero: blog('longevity-orchid-shadow.webp'),
    heroAlt: 'The shadow of a hand holding the Orchid bottle, cast across a pale wall',
    body: [
      {
        t: 'lead',
        text: 'Do you notice your perfume fading a few hours after applying it? You are not alone — and the fix is not complicated. From spraying on the right spots to layering with lotion, here are five practical habits that keep a favourite scent fresh and noticeable all day.',
      },
      { t: 'h2', text: '01 — Moisturise first, fragrance next' },
      {
        t: 'p',
        text: 'Dry skin has nowhere to hold a scent. Hydrated skin does: moisture and lipids give fragrance molecules something to bind to, so less is lost to evaporation in the first hour (Hadjiefstathiou et al., 2025).',
      },
      {
        t: 'tip',
        text: 'Spritz perfume right after a shower while your skin is still slightly damp, or apply a fragrance-free lotion before spraying.',
      },
      {
        t: 'quote',
        text: 'Well-moisturised skin acts as a smooth, slightly adhesive surface, helping the fragrance grip. Dry skin tends to have a rough texture and microscopic fissures, making fragrance evaporate more quickly.',
        cite: 'Octivia Morgan, founder and CEO of Octavia Morgan Los Angeles, in InStyle (2025)',
      },
      {
        t: 'p',
        text: 'By keeping your skin hydrated you are not only **improving overall fragrance retention** but also making your **scent projection more consistent** through the day.',
      },
      { t: 'h2', text: '02 — Apply on the right spots' },
      {
        t: 'p',
        text: 'Spraying on **pulse points** — neck, wrists and behind the ears — is common because these areas emit body heat that activates fragrance molecules and amplifies the scent. The trade-off is that heat also makes a perfume **wear off faster** through **faster evaporation** (Teixeira, 2009).',
      },
      {
        t: 'p',
        text: 'Débora Xavier, product development manager at Granado, recommends a balanced approach: apply to both warm pulse points for performance and cooler areas — forearm or upper chest — for longevity (InStyle, 2025). That way you get bold diffusion *and* staying power.',
      },
      {
        t: 'table',
        head: ['Application area', 'Effect on fragrance', 'Best for'],
        rows: [
          ['Neck & wrists', 'Heat activates fragrance molecules, amplifying projection but fading faster', 'Strong projection & initial impact'],
          ['Behind the ears', 'Creates a subtle scent trail close to others', 'Close interactions'],
          ['Forearms & upper chest', 'Cooler areas, slower evaporation, helping perfume last longer', 'Long-lasting fragrance'],
        ],
      },
      { t: 'h2', text: '03 — The chemistry of longevity' },
      {
        t: 'p',
        text: 'Fragrances are structured in three layers of notes that determine how they smell and how long they smell. The structure is based on the **molecular weight** of each ingredient:',
      },
      {
        t: 'ul',
        items: [
          '**Top notes** are lighter molecules that evaporate quickly. They create the first impression but fade within minutes to an hour.',
          '**Heart notes** are medium-weight molecules that give the perfume its main character and last several hours.',
          '**Base notes** are heavier and slower-evaporating. They provide depth, richness and longevity, often lingering all day.',
        ],
      },
      {
        t: 'quote',
        text: 'The more heart and base notes a fragrance contains, the longer it tends to last on the skin. Fragrances made up of mostly light top notes tend to have a shorter wear time as they evaporate more quickly.',
        cite: 'Débora Xavier, in InStyle (2025)',
      },
      {
        t: 'p',
        text: 'Concentration matters just as much: with a higher oil concentration, the base contains less alcohol and water and more oil, which means it evaporates slower and lasts longer on the skin.',
      },
      { t: 'h2', text: '04 — Store it the right way' },
      {
        t: 'p',
        text: 'Perfumes are delicate. Both natural and synthetic fragrance oils are vulnerable to heat, oxygen and light (Sousa et al., 2022).',
      },
      {
        t: 'ul',
        items: [
          '**Oxygen and air exposure.** Fragrance compounds oxidise when exposed to air during storage, producing hydroperoxides and other unstable by-products that alter both scent and safety (Christensson et al., 2013).',
          '**Light and photodegradation.** Ultraviolet light or direct sunlight degrades perfume molecules, changing stability, colour and scent (Niu et al., 2025; Ozaki et al., 2021).',
          '**Temperature.** High temperatures accelerate degradation and destroy minor compounds. Though present in small amounts, those compounds add the finishing touches that create subtle nuances — a fresh citrus sparkle, a green herbal lift. Without them, fragrances smell flatter (Ganosi et al., 2023).',
        ],
      },
      {
        t: 'quote',
        text: 'Perfume is almost like a living organism — it is extremely sensitive to environmental changes. A shift in temperature can set off chemical reactions that cause perfumes to age faster. Fresh scents like citrus or raw patchouli may smell flat, while ultraviolet rays can even turn a perfume’s colour from amber to green.',
        cite: 'Francis Kurkdjian, in Vogue (2024)',
      },
      {
        t: 'tip',
        text: 'Store perfume at room temperature or in the refrigerator — but not in the fridge door, where the temperature fluctuates every time it opens.',
      },
      { t: 'h2', text: '05 — Mix and match through layering' },
      {
        t: 'p',
        text: 'Using a matching lotion, body wash and perfume from the same scent family creates a strong base. It lets the fragrance sink into the skin more effectively, helping the scent evolve smoothly and last longer.',
      },
      {
        t: 'quote',
        text: 'Layering traps aromatic oils in the skin’s moisture barrier, extending wear and projection of your fragrance throughout the day.',
        cite: 'Octivia Morgan, in InStyle (2025)',
      },
      {
        t: 'p',
        text: 'Fragrance specialists Morgan and Pia Long, perfumer and co-founder of Olfiction Limited, share four practical rules for layering:',
      },
      {
        t: 'ol',
        items: [
          'Spray each fragrance on a blotter or stiff card to test combinations without the influence of skin chemistry.',
          'Apply heavier scents first so they do not overpower lighter ones.',
          'Use simple base notes like wood, musk or vanilla and layer complex scents above.',
          'Let the blend dry down on the blotter for 30–60 minutes. If it still smells great, you have likely found a match.',
        ],
      },
      {
        t: 'p',
        text: 'Layering does not only boost longevity — it helps you craft a **unique signature scent**.',
      },
      {
        t: 'image',
        src: blog('longevity-violet-shadow.webp'),
        alt: 'The shadow of a hand reaching towards the Violet bottle',
        caption: 'Violet, layered over a musk base — a signature built rather than bought.',
      },
      { t: 'h2', text: 'Conclusion: unlocking perfume longevity' },
      {
        t: 'p',
        text: 'Getting perfume to last is not about luck. It is about knowing the science and applying a few expert habits. Hydrate your skin, apply strategically, understand the chemistry, store bottles properly and experiment with layering, and you can enjoy a fragrance that stays fresh and noticeable all day.',
      },
      {
        t: 'p',
        text: 'A final thought: treat perfume care as part of the fragrance ritual. The better you treat your perfume, the better it will treat you.',
      },
      { t: 'h3', text: 'References' },
      {
        t: 'refs',
        items: [
          'Christensson, J. B., Andersen, K.E., Bruze, M., Johansen, J. D., Garcia-Bravo, B., Arnau, A.G., Goh, C-L., Nixon, R. & White, I. R. (2012). Air-oxidized linalool: a frequent cause of fragrance contact allergy. Contact Dermatitis, 67(5). 247–569.',
          'Eugenia, G., Barda, C. Grafakou, M-E., Rallis, M. C. & Skaltsa, H. (2023). An In-Depth Stability Study of the Essential Oils from Mentha x piperita, Mentha spicata, Origanum vulgare, and Thymus vulgaris: The Impact of Thermal and Storage Conditions. Separations, 10(6), 488. https://doi.org/10.3390/separations10090488',
          'Hadjiefstathiou, E., Savaray, G., Malhiac, C., Terescenco, D. & Picard, C. (2025). Exploring the impact of fragrance molecular and skin properties on the evaporation profile of fragrances. International Journal of Cosmetic Science. https://doi.org/10.1111/ics.13085',
          'Molvar, K. & Noble, A. (2024, January 25). 8 Common Mistakes We Make When Wearing Perfume — And How to Fix Them. Vogue.',
          'Niu, X., Wu, J., Chen, Y., Luo, N. & Gao, Y. (2025). Overlooked Photochemical Risk of Antimicrobial Fragrances: Formation of Potent Allergens and Their Mechanistic Pathways. Toxics, 13(5). 386. https://doi.org/10.3390/toxics13050386',
          'Ozaki, N., Tanaka, T., Kindaichi, T. & Ohashi, A. (2021). Photodegradation of fragrance materials and triclosan in water: Direct photolysis and photosensitized degradation. Environmental Technology & Innovation, 23, 101766. https://doi.org/10.1016/j.eti.2021.101766',
          'Sousa, V. I., Parente, J. F., Marques, J. F., Forte, M. A. & Tavares, C. J. (2022). Microencapsulation of Essential Oils: A Review. Polymers (Basel), 14(9), 1730. https://doi.org/10.3390/polym14091730',
          'Sullivan, C. (2025, June 19). The Truth About What Makes Fragrance Last Longer, According to Experts. InStyle.',
          'Teixeira, M. A., Rodríguez, O., Mata, V. G. & Rodrigues, A. E. (2009). The diffusion of perfume mixtures and the odor performance. Chemical Engineering Science, 64(11). 2570–2589.',
          'Xue, F. (2024, November 10). How to Layer Fragrance to Create Your Signature Scent. Byrdie.',
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: 'perfume-gift-guide-malaysia-souvenirs',
    title: 'Perfume Gift Guide & Must-Buy Malaysia Souvenirs',
    cardTitle: 'Perfume Gift Guide & Malaysia Souvenirs',
    category: 'Gifting',
    date: '30 September 2025',
    readTime: '6 min',
    excerpt:
      'How to read a personality, match an occasion and choose a bottle that doubles as the souvenir someone actually keeps.',
    hero: blog('gift-guide-orchid.webp'),
    heroAlt: 'The Orchid bottle and its box on a ceramic tray beside a fresh bloom',
    body: [
      {
        t: 'lead',
        text: 'Looking for a meaningful gift, or the perfect Malaysian souvenir? Perfume is one of the most timeless and personal presents you can give. A beautiful fragrance is more than a scent — it is a memory, an identity, and a symbol of thoughtfulness.',
      },
      {
        t: 'p',
        text: 'This guide walks through how to choose the right scent for any occasion, whether you are celebrating someone you love, choosing a corporate gift, or searching for a Malaysian perfume that doubles as a premium must-buy for travellers.',
      },
      {
        t: 'image',
        src: blog('gift-guide-boutique.webp'),
        alt: 'A customer leaving a Legendary boutique with a gift bag, and testing a rollerball at the counter',
      },
      { t: 'h2', text: 'Why perfume is the perfect gift and souvenir' },
      {
        t: 'p',
        text: 'Unlike flowers or chocolates, perfume lasts much longer. Every spritz becomes a reminder of the giver and the moment. Choosing a bottle of Legendary means you are gifting something elegant, practical and deeply meaningful.',
      },
      {
        t: 'ul',
        items: [
          '**Personal and thoughtful** — match the scent to someone’s personality.',
          '**Elegant and premium** — ideal for birthdays, anniversaries or milestones.',
          '**A real Malaysian souvenir** — a fragrance is a cultural keepsake you can actually wear.',
        ],
      },
      { t: 'h2', text: 'How to choose the right perfume gift' },
      { t: 'h3', text: '1. Match their personality' },
      {
        t: 'ul',
        items: [
          '**Romantic and dreamy** — floral perfumes like [Orchid](/product/orchid): graceful and timeless.',
          '**Confident and bold** — fresh, energising scents such as [Spirit](/product/spirit): versatile for daily wear.',
          '**Mysterious and elegant** — woody, heritage-inspired scents like [Mahsuri](/product/mahsuri), rooted in Malaysian legend.',
        ],
      },
      { t: 'h3', text: '2. Think about the occasion' },
      {
        t: 'ul',
        items: [
          '**Birthdays** — a unique fragrance they will treasure every day.',
          '**Anniversaries** — warm, romantic scents that say “I love you”.',
          '**Festive seasons** — Hari Raya, Christmas and CNY: a perfume gift set that impresses.',
          '**Corporate gifts** — sophisticated scents that leave a professional impression.',
        ],
      },
      { t: 'h3', text: '3. Packaging matters' },
      {
        t: 'p',
        text: 'Presentation is everything. Every Legendary set arrives in a designed box, ready to give — which is what makes it both a thoughtful gift and a premium Malaysian must-buy.',
      },
      {
        t: 'image',
        src: blog('gift-guide-counter.webp'),
        alt: 'A customer choosing between bottles at a Legendary department store counter',
      },
      { t: 'h2', text: 'The best gift sets' },
      {
        t: 'ul',
        items: [
          '[Spirit I](/product/spirit) — elegant and confident, a timeless Malaysian perfume.',
          '[Spirit II](/product/spirit) — fresh and vibrant, perfect for everyday wear.',
          '[3 Wishes](/product/3-wishes) — a symbolic trio representing hope, happiness and blessings.',
        ],
      },
      {
        t: 'p',
        text: 'These curated sets are not only meaningful presents but also the easiest souvenirs to carry home.',
      },
      { t: 'h2', text: 'The best Malaysian perfume: Orchid' },
      {
        t: 'p',
        text: 'When it comes to choosing the best Malaysian souvenir, nothing captures the spirit of the country better than our signature [Orchid](/product/orchid).',
      },
      {
        t: 'p',
        text: 'This iconic fragrance is loved by tourists from China, Korea, the Arab countries, Japan and across Europe. It is more than a scent — it is a timeless piece of Malaysia in a bottle: elegant, memorable, and crafted with care. It represents the harmony of tradition and modern artistry that defines the very best of Malaysian perfumery.',
      },
      {
        t: 'p',
        text: 'For many travellers, Orchid has become the ultimate Malaysian must-buy: a keepsake that embodies culture, beauty and sophistication.',
      },
      { t: 'h2', text: 'The essence of Legendary' },
      {
        t: 'p',
        text: 'Perfume is more than fragrance — it is a story told through scent. With Legendary you are not just gifting perfume; you are gifting a piece of Malaysian heritage, artistry and identity.',
      },
      {
        t: 'ul',
        items: [
          'Explore the [full collection online](/shop), or browse the [gift sets](/shop?filter=gifts).',
          'Visit us at Pavilion KL, KLCC Isetan, Genting Highlands Sky Avenue, Melaka Jonker Street, Langkawi Airport, Parkson Imago Sabah, KLIA 1 Eraman, KLIA 2 Gate P, and all SASA outlets nationwide — see the [Store Locator](/stores).',
          'Give a gift that lingers in memory.',
        ],
      },
    ],
  },
]

export const getArticle = (slug: string) => articles.find((a) => a.slug === slug)

/** Neighbours for the previous / next rail at the foot of an article. */
export function articleNeighbours(slug: string) {
  const i = articles.findIndex((a) => a.slug === slug)
  return {
    prev: i > 0 ? articles[i - 1] : undefined,
    next: i >= 0 && i < articles.length - 1 ? articles[i + 1] : undefined,
  }
}
