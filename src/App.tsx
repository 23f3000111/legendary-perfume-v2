import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Product from './pages/Product'
import Stores from './pages/Stores'
import About from './pages/About'
import Journal from './pages/Journal'
import Article from './pages/Article'
import Contact from './pages/Contact'
import Checkout from './pages/Checkout'
import Faq from './pages/Faq'
import Policy from './pages/Policy'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/about" element={<About />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/journal/:slug" element={<Article />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/checkout" element={<Checkout />} />
        {/* Customer care. Slugs stay single words so no URL carries a dash. */}
        <Route path="/faq" element={<Faq />} />
        <Route path="/shipping" element={<Policy />} />
        <Route path="/returns" element={<Policy />} />
        <Route path="/terms" element={<Policy />} />
        <Route path="/privacy" element={<Policy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
