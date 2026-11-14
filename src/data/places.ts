// Places on the "A Scented Memory of Malaysia" interactive map.
//
// x / y are percentage positions over the supplied map artwork
// (public/map.webp). That artwork is stylised, with Borneo drawn much closer to
// the peninsula than it really is, so pins are calibrated against the drawing
// rather than projected from raw coordinates. Genting sits only about 35km
// from KL, so its pin is nudged north east of its true spot to keep the two
// hit areas clear; Kota Kinabalu's is pulled inland, since the coastline spot
// read as sitting in the sea.
//
// The places live in src/content/places.json. The Legendary team edits each
// pin's name, words and card photo in the dashboard (the client re-shot Melaka
// and Kota Kinabalu for this section, and asked for that card to read simply
// "Spirit"); where a pin sits, the scent it opens and its boutiques stay as
// they are. Read `scentPlaces` when rendering, so a preview's drafts show.
import data from '../content/places.json'
import type { PlaceEntry, PlacesDoc } from '../../api/_lib/content/schema'
import { asset } from '../lib/asset'
import { getProduct, productsByCollection } from './products'
import { storesDoc } from './stores'

export type ScentPlace = PlaceEntry

export const placesDoc: PlacesDoc = data
export const scentPlaces = placesDoc.places

/**
 * Resolves what a pin should show: a single scent, or a whole collection.
 * Null when the pin's product is no longer in the shop, so the map leaves that
 * pin out instead of failing.
 */
export function placeTarget(place: ScentPlace) {
  const product = getProduct(place.productId)
  if (!product) return null
  const inCollection = place.collectionId ? productsByCollection(place.collectionId) : []
  const boutiques = place.storeIds
    .map((id) => storesDoc.stores.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s)

  return {
    product,
    image: asset(place.cardImage ?? product.image),
    href: place.collectionId ? `/shop?collection=${place.collectionId}` : `/product/${product.id}`,
    title: place.scentLabel ?? product.name,
    meta: place.familyLabel ?? `${product.family} · RM ${product.price}`,
    count: inCollection.length,
    boutiques,
  }
}
