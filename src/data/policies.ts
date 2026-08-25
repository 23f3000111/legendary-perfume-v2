import type { Block } from '../components/ui/Prose'
import { SUPPORT_EMAIL, WHATSAPP_DISPLAY } from '../lib/concierge'

/* ------------------------------------------------------------------
   The customer care pages: shipping, returns, terms and privacy.

   Copy is the client's, set in the house voice and typography. House
   style throughout: no hyphens or dashes anywhere in the wording, and
   phone numbers spaced rather than hyphenated.
   ------------------------------------------------------------------ */

export interface Policy {
  slug: string
  title: string
  eyebrow: string
  intro: string
  /** Shown under the title, so people know how current the page is. */
  updated: string
  body: Block[]
}

const UPDATED = 'August 2026'

export const shippingPolicy: Policy = {
  slug: 'shipping',
  title: 'Shipping Policy',
  eyebrow: 'Customer Care',
  intro:
    'Everything you need to know about how your order reaches you, written for our Malaysian customers.',
  updated: UPDATED,
  body: [
    {
      t: 'lead',
      text:
        'Welcome to Legendary, where our mission is to deliver our exquisite scents to your doorstep with both care and efficiency. Here is how that works.',
    },

    { t: 'h2', text: 'Processing time' },
    {
      t: 'p',
      text:
        'Orders are typically processed within one to two business days. During peak seasons or promotional periods this may take a little longer, simply because demand is high.',
    },

    { t: 'h2', text: 'Shipping options and costs' },
    /* Revision 4: the client removed the standard and express tiers, because
       neither will exist. Delivery is free on anything bought, with no
       minimum spend, so the table carries one line. */
    {
      t: 'table',
      head: ['Service', 'Arrives in', 'Cost'],
      rows: [['Delivery', '5 to 7 business days', 'Free on every order, whatever you buy.']],
    },

    { t: 'h2', text: 'Order tracking' },
    {
      t: 'p',
      text:
        'You will receive a confirmation email with a tracking number as soon as your order is dispatched, so you can follow it the whole way.',
    },

    { t: 'h2', text: 'Packaging' },
    {
      t: 'p',
      text:
        'Our perfumes are carefully packed using eco friendly materials. That keeps your bottle safe in transit and keeps us honest about our commitment to sustainability.',
    },

    { t: 'h2', text: 'Customs and duties for international orders' },
    {
      t: 'p',
      text:
        'International orders may incur customs fees or duties. These are the responsibility of the recipient and they vary by country.',
    },

    { t: 'h2', text: 'Damages and issues' },
    {
      t: 'p',
      text:
        'Please inspect your order as soon as it arrives and contact us straight away if the item is defective, damaged, or if you have received the wrong item. Our WhatsApp line is ' +
        `${WHATSAPP_DISPLAY}.`,
    },

    { t: 'h2', text: 'Returns and exchanges' },
    {
      t: 'p',
      text: 'Everything on that subject lives on our [Return, Refund & Exchange](/returns) page.',
    },

    {
      t: 'tip',
      text:
        'Thank you for choosing Legendary. We are committed to making your experience with us as delightful as our fragrances.',
    },
  ],
}

export const returnsPolicy: Policy = {
  slug: 'returns',
  title: 'Return, Refund & Exchange',
  eyebrow: 'Customer Care',
  intro:
    'If something is not right with your order, here is exactly how we put it right.',
  updated: UPDATED,
  body: [
    { t: 'h2', text: 'Returns' },
    { t: 'p', text: 'We gladly accept returns for items that meet the following criteria:' },
    { t: 'ul', items: ['A faulty or damaged item', 'An incorrect item'] },
    {
      t: 'p',
      text:
        `If your order arrives damaged or you receive the wrong item, please reach out to our Customer Service hotline on WhatsApp at ${WHATSAPP_DISPLAY} within 48 hours. We handle every case individually and we are committed to finding a solution that leaves you happy. If you qualify for a replacement or a refund, we will process it using your original payment method.`,
    },
    {
      t: 'p',
      text:
        'To start a return, please make sure your item is in the same condition as when you received it: unworn or unused, with tags, and in its original packaging. You will also need the receipt or proof of purchase. Refunds and replacements are issued once we have received the damaged or faulty product and completed our quality checks.',
    },
    { t: 'h3', text: 'Please include these details when you write to us' },
    {
      t: 'ol',
      items: [
        'The platform you purchased from',
        'The item name',
        'Your reason for the return',
        'A photo of the affected item',
      ],
    },
    { t: 'p', text: '**Items returned without prior authorisation cannot be accepted.**' },

    { t: 'h2', text: 'Damage and issues' },
    {
      t: 'p',
      text:
        'We urge you to inspect your order as soon as it arrives. If you find a defect, any damage, or an incorrect item, get in touch with us immediately. The sooner we know, the sooner we can assess it and make it right.',
    },

    { t: 'h2', text: 'Items we cannot take back' },
    {
      t: 'p',
      text: 'Regrettably, we are unable to accept returns on items marked as sale items.',
    },

    { t: 'h2', text: 'Exchanges' },
    {
      t: 'p',
      text:
        'For the quickest resolution, return the item you have. Once that return is approved, place a separate order for the piece you would prefer.',
    },

    { t: 'h2', text: 'Refunds' },
    {
      t: 'p',
      text:
        'Once we have received and inspected your return, we will let you know whether your refund has been approved. If it has, the refund goes back to your original payment method within 14 working days. Please bear in mind that your bank or credit card company may need a little more time to post it.',
    },
    {
      t: 'p',
      text:
        `If 14 working days have passed and you still have not seen your refund, please contact our Customer Service hotline on WhatsApp at ${WHATSAPP_DISPLAY}.`,
    },
    {
      t: 'tip',
      text:
        `Any further questions, or anything at all you need a hand with? Our Customer Service hotline is on WhatsApp at ${WHATSAPP_DISPLAY}.`,
    },
  ],
}

export const termsOfService: Policy = {
  slug: 'terms',
  title: 'Terms of Service',
  eyebrow: 'Legal',
  intro: 'The terms you agree to when you browse this site or buy from us.',
  updated: UPDATED,
  body: [
    {
      t: 'lead',
      text:
        'This website is operated by Legendary. Throughout the site, the terms "we", "us" and "our" refer to Legendary. We offer this website, including all information, tools and Services available from it, to you, the user, on the condition that you accept all the terms, conditions, policies and notices stated here.',
    },
    {
      t: 'p',
      text:
        'By visiting our site or purchasing something from us, you engage in our Service and agree to be bound by the following terms and conditions, together with any additional terms, conditions and policies referenced here or available by hyperlink. These Terms of Service apply to every user of the site, including browsers, vendors, customers, merchants and contributors of content.',
    },
    {
      t: 'p',
      text:
        'Please read these Terms of Service carefully before you access or use our website. By accessing or using any part of the site, you agree to be bound by them. If you do not agree to all the terms and conditions of this agreement, you may not access the website or use any Services. If these Terms of Service are considered an offer, acceptance is expressly limited to these Terms of Service.',
    },

    { t: 'h2', text: 'Section 01: Online store terms' },
    {
      t: 'p',
      text:
        'By agreeing to these Terms of Service, you confirm that you are at least the age of majority in your state or province of residence, or that you are the age of majority in your state or province of residence and you have given us your consent to allow any of your minor dependents to use this site.',
    },
    {
      t: 'p',
      text:
        'You may not use our products for any illegal or unauthorised purpose, and in using the Service you may not violate any law in your jurisdiction, including copyright law.',
    },
    {
      t: 'p',
      text:
        'You must not transmit any worms or viruses, or any code of a destructive nature. A breach or violation of any of these Terms will result in the immediate termination of your Services.',
    },

    { t: 'h2', text: 'Section 02: General conditions' },
    { t: 'p', text: 'We reserve the right to refuse Service to anyone for any reason at any time.' },
    {
      t: 'p',
      text:
        'You understand that your content, not including credit card information, may be transferred unencrypted, and that this may involve transmissions over various networks and changes to conform to the technical requirements of connecting networks or devices. Credit card information is always encrypted during transfer over networks.',
    },
    {
      t: 'p',
      text:
        'You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service, any use of the Service, any access to the Service, or any contact on the website through which the Service is provided, without our express written permission.',
    },
    {
      t: 'p',
      text:
        'The headings in this agreement are included for convenience only. They do not limit or otherwise affect these Terms.',
    },

    { t: 'h2', text: 'Section 03: Accuracy, completeness and timeliness of information' },
    {
      t: 'p',
      text:
        'We are not responsible if information made available on this site is not accurate, complete or current. The material here is provided for general information only and should not be relied on as the sole basis for making decisions without consulting primary, more accurate, more complete or more timely sources. Any reliance on the material on this site is at your own risk.',
    },
    {
      t: 'p',
      text:
        'This site may contain historical information. Historical information is, by its nature, not current, and it is provided for your reference only. We reserve the right to modify the contents of this site at any time, but we have no obligation to update any information on it. You agree that it is your responsibility to monitor changes to our site.',
    },

    { t: 'h2', text: 'Section 04: Modification to the Service and prices' },
    { t: 'p', text: 'Prices for our products are subject to change without notice.' },
    {
      t: 'p',
      text:
        'We reserve the right to modify or discontinue the Service, or any part or content of it, without notice at any time.',
    },

    { t: 'h2', text: 'Section 05: Products or Services' },
    {
      t: 'p',
      text:
        'Certain products or Services may be available exclusively online through the website. They may have limited quantities and are subject to return or exchange only according to our Refund Policy.',
    },
    {
      t: 'p',
      text:
        'We have made every effort to display the colours and images of our products as accurately as possible. We cannot guarantee that your monitor will display any colour accurately.',
    },
    {
      t: 'p',
      text:
        'We reserve the right, but are not obliged, to limit the sales of our products or Services to any person, geographic region or jurisdiction, and we may exercise that right case by case. We reserve the right to limit the quantities of any products or Services we offer. All descriptions of products and all product pricing are subject to change at any time without notice, at our sole discretion. We reserve the right to discontinue any product at any time. Any offer for any product or Service made on this site is void where prohibited.',
    },
    {
      t: 'p',
      text:
        'We do not warrant that the quality of any products, Services, information or other material purchased or obtained by you will meet your expectations, or that any errors in the Service will be corrected.',
    },

    { t: 'h2', text: 'Section 06: Accuracy of billing and account information' },
    {
      t: 'p',
      text:
        'We reserve the right to refuse any order you place with us. We may, at our sole discretion, limit or cancel quantities purchased per person, per household or per order. These restrictions may include orders placed by or under the same customer account, the same credit card, or orders that use the same billing or shipping address. If we change or cancel an order, we may try to notify you using the email address, billing address or phone number provided when the order was made. We reserve the right to limit or prohibit orders that, in our sole judgement, appear to be placed by dealers, resellers or distributors.',
    },
    {
      t: 'p',
      text:
        'You agree to provide current, complete and accurate purchase and account information for every purchase made at our store. You agree to update your account and other information promptly, including your email address and your card numbers and expiry dates, so that we can complete your transactions and contact you as needed.',
    },

    { t: 'h2', text: 'Section 07: Optional tools' },
    {
      t: 'p',
      text:
        'We may give you access to third party tools that we neither monitor nor have any control or input over.',
    },
    {
      t: 'p',
      text:
        'You acknowledge and agree that we provide access to such tools as they are and as they are available, without any warranties, representations or conditions of any kind and without any endorsement. We have no liability whatsoever arising from or relating to your use of optional third party tools.',
    },
    {
      t: 'p',
      text:
        'Any use of the optional tools offered through the site is entirely at your own risk and discretion, and you should make sure you are familiar with, and approve of, the terms on which those tools are provided by the relevant third party.',
    },
    {
      t: 'p',
      text:
        'We may also offer new Services or features through the website in future, including new tools and resources. Those will also be subject to these Terms of Service.',
    },

    { t: 'h2', text: 'Section 08: Third party links' },
    {
      t: 'p',
      text:
        'Certain content, products and Services available through our Service may include materials from third parties.',
    },
    {
      t: 'p',
      text:
        'Third party links on this site may direct you to websites that are not affiliated with us. We are not responsible for examining or evaluating their content or accuracy, and we do not warrant and will not have any liability or responsibility for any third party materials or websites, or for any other materials, products or Services of third parties.',
    },
    {
      t: 'p',
      text:
        'We are not liable for any harm or damages related to the purchase or use of goods, Services, resources, content or any other transactions made in connection with any third party websites. Please review the third party policies and practices carefully and make sure you understand them before you enter into any transaction. Complaints, claims, concerns or questions about third party products should be directed to the third party.',
    },

    { t: 'h2', text: 'Section 09: User comments, feedback and other submissions' },
    {
      t: 'p',
      text:
        'If you send us certain specific submissions at our request, such as contest entries, or if you send us creative ideas, suggestions, proposals, plans or other materials without a request from us, whether online, by email, by post or otherwise, you agree that we may at any time, without restriction, edit, copy, publish, distribute, translate and otherwise use those comments in any medium. We are under no obligation to keep any comments in confidence, to pay compensation for any comments, or to respond to any comments.',
    },
    {
      t: 'p',
      text:
        'We may, but are not obliged to, monitor, edit or remove content that we decide at our sole discretion is unlawful, offensive, threatening, libellous, defamatory, pornographic, obscene or otherwise objectionable, or that violates any party’s intellectual property or these Terms of Service.',
    },
    {
      t: 'p',
      text:
        'You agree that your comments will not violate any right of any third party, including copyright, trademark, privacy, personality or any other personal or proprietary right. You further agree that your comments will not contain libellous or otherwise unlawful, abusive or obscene material, or any computer virus or other malware that could affect the operation of the Service or any related website. You may not use a false email address, pretend to be someone other than yourself, or otherwise mislead us or third parties as to the origin of any comments. You are solely responsible for any comments you make and for their accuracy. We take no responsibility and assume no liability for any comments posted by you or any third party.',
    },

    { t: 'h2', text: 'Section 10: Personal information' },
    {
      t: 'p',
      text:
        'Your submission of personal information through the store is governed by our [Privacy Policy](/privacy).',
    },

    { t: 'h2', text: 'Section 11: Errors, inaccuracies and omissions' },
    {
      t: 'p',
      text:
        'Occasionally there may be information on our site or in the Service that contains typographical errors, inaccuracies or omissions relating to product descriptions, pricing, promotions, offers, shipping charges, transit times or availability. We reserve the right to correct any errors, inaccuracies or omissions, and to change or update information or cancel orders if any information in the Service or on any related website is inaccurate at any time without prior notice, including after you have submitted your order.',
    },
    {
      t: 'p',
      text:
        'We undertake no obligation to update, amend or clarify information in the Service or on any related website, including pricing information, except as required by law. No specified update or refresh date applied in the Service or on any related website should be taken to indicate that all information has been modified or updated.',
    },

    { t: 'h2', text: 'Section 12: Prohibited uses' },
    {
      t: 'p',
      text:
        'In addition to the other prohibitions set out in these Terms of Service, you are prohibited from using the site or its content:',
    },
    {
      t: 'ul',
      items: [
        'for any unlawful purpose',
        'to solicit others to perform or participate in any unlawful acts',
        'to violate any international, federal, provincial or state regulations, rules, laws or local ordinances',
        'to infringe upon or violate our intellectual property rights or the intellectual property rights of others',
        'to harass, abuse, insult, harm, defame, slander, disparage, intimidate or discriminate on the basis of gender, sexual orientation, religion, ethnicity, race, age, national origin or disability',
        'to submit false or misleading information',
        'to upload or transmit viruses or any other type of malicious code that will or may affect the functionality or operation of the Service, any related website, other websites, or the Internet',
        'to collect or track the personal information of others',
        'to spam, phish, pharm, pretext, spider, crawl or scrape',
        'for any obscene or immoral purpose',
        'to interfere with or circumvent the security features of the Service, any related website, other websites, or the Internet',
      ],
    },
    {
      t: 'p',
      text:
        'We reserve the right to terminate your use of the Service or any related website for violating any of these prohibited uses.',
    },

    { t: 'h2', text: 'Section 13: Disclaimer of warranties and limitation of liability' },
    {
      t: 'p',
      text:
        'We do not guarantee, represent or warrant that your use of our Service will be uninterrupted, timely, secure or free of error.',
    },
    {
      t: 'p',
      text: 'We do not warrant that the results obtained from the use of the Service will be accurate or reliable.',
    },
    {
      t: 'p',
      text:
        'You agree that from time to time we may remove the Service for indefinite periods, or cancel it at any time, without notice to you.',
    },
    {
      t: 'p',
      text:
        'You expressly agree that your use of, or inability to use, the Service is at your sole risk. The Service and all products and Services delivered to you through it are, except where we have expressly stated otherwise, provided as they are and as available for your use, without any representation, warranties or conditions of any kind, either express or implied, including all implied warranties or conditions of merchantability, merchantable quality, fitness for a particular purpose, durability, title and non infringement.',
    },
    {
      t: 'p',
      text:
        'In no case shall Legendary, our directors, officers, employees, affiliates, agents, contractors, interns, suppliers, Service providers or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special or consequential damages of any kind, including lost profits, lost revenue, lost savings, loss of data, replacement costs, or any similar damages, whether based in contract, tort including negligence, strict liability or otherwise, arising from your use of any of the Service or any products procured using the Service, or for any other claim related in any way to your use of the Service or any product, including any errors or omissions in any content, or any loss or damage of any kind incurred as a result of the use of the Service or any content or product posted, transmitted or otherwise made available through the Service, even if we have been advised of the possibility. Because some states or jurisdictions do not allow the exclusion or limitation of liability for consequential or incidental damages, in those states or jurisdictions our liability shall be limited to the maximum extent permitted by law.',
    },

    { t: 'h2', text: 'Section 14: Indemnification' },
    {
      t: 'p',
      text:
        'You agree to indemnify, defend and hold harmless Legendary and our parent, subsidiaries, affiliates, partners, officers, directors, agents, contractors, licensors, Service providers, subcontractors, suppliers, interns and employees, from any claim or demand, including reasonable legal fees, made by any third party because of or arising out of your breach of these Terms of Service or the documents they incorporate by reference, or your violation of any law or the rights of a third party.',
    },

    { t: 'h2', text: 'Section 15: Severability' },
    {
      t: 'p',
      text:
        'If any provision of these Terms of Service is determined to be unlawful, void or unenforceable, that provision shall nonetheless be enforceable to the fullest extent permitted by applicable law, and the unenforceable portion shall be deemed severed from these Terms of Service. Such a determination shall not affect the validity and enforceability of any other remaining provision.',
    },

    { t: 'h2', text: 'Section 16: Termination' },
    {
      t: 'p',
      text:
        'The obligations and liabilities of the parties incurred before the termination date shall survive the termination of this agreement for all purposes.',
    },
    {
      t: 'p',
      text:
        'These Terms of Service are effective unless and until terminated by either you or us. You may terminate them at any time by notifying us that you no longer wish to use our Services, or by ceasing to use our site.',
    },
    {
      t: 'p',
      text:
        'If in our sole judgement you fail, or we suspect that you have failed, to comply with any term or provision of these Terms of Service, we may also terminate this agreement at any time without notice. You will remain liable for all amounts due up to and including the date of termination, and we may deny you access to our Services or any part of them.',
    },

    { t: 'h2', text: 'Section 17: Entire agreement' },
    {
      t: 'p',
      text:
        'These Terms of Service and any separate agreements under which we provide you Services shall be governed by and construed in accordance with the laws of Malaysia.',
    },

    { t: 'h2', text: 'Section 18: Governing law' },
    {
      t: 'p',
      text:
        'These Terms of Service and any separate agreements under which we provide you Services shall be governed by and construed in accordance with the laws of Malaysia.',
    },

    { t: 'h2', text: 'Section 19: Changes to Terms of Service' },
    { t: 'p', text: 'You can review the most current version of the Terms of Service at any time on this page.' },
    {
      t: 'p',
      text:
        'We reserve the right, at our sole discretion, to update, change or replace any part of these Terms of Service by posting updates and changes to our website. It is your responsibility to check our website periodically for changes. Your continued use of or access to our website or the Service following the posting of any changes constitutes acceptance of those changes.',
    },

    { t: 'h2', text: 'Contact information' },
    {
      t: 'p',
      text: 'Questions about the Terms of Service should be sent to us at info@legendaryperfume.com.',
    },
  ],
}

export const privacyPolicy: Policy = {
  slug: 'privacy',
  title: 'Privacy Policy',
  eyebrow: 'Legal',
  intro: 'What we collect, why we collect it, and who we share it with.',
  updated: UPDATED,
  body: [
    {
      t: 'lead',
      text:
        'Legendary is committed to protecting your privacy. When we acquire any information about you during your use of this site, how and when we use that information is covered here.',
    },
    { t: 'p', text: 'Our privacy policy explains:' },
    {
      t: 'ul',
      items: [
        'what personal information we collect',
        'how we collect and use that personal information',
        'who we share it with',
        'who you may contact to find out more about the personal information collected',
      ],
    },
    {
      t: 'p',
      text:
        'There may be links on this website that lead to sites other than https://www.legendary.com.my. This Privacy Policy does not apply to any of those sites. By using this site, you accept our privacy policy. You are not authorised to use this site if you do not agree to it.',
    },

    { t: 'h2', text: 'Information collected' },
    {
      t: 'p',
      text:
        'When you subscribe to https://www.legendary.com.my, either by joining our mailing list or by purchasing a product or a subscription, we may collect some personal information. That includes, but is not limited to:',
    },
    {
      t: 'ul',
      items: [
        'Name',
        'Email address',
        'Delivery address',
        'Mailing address, for billing purposes',
        'Telephone numbers',
        'Relevant company information, where applicable',
        'Gender and date of birth',
      ],
    },
    {
      t: 'p',
      text:
        'It is important that you give us complete information in the required fields on our site so that you can enjoy our products and services.',
    },

    { t: 'h2', text: 'How we use information' },
    { t: 'p', text: 'The personal information gathered will be used for one or more of the following purposes:' },
    {
      t: 'ul',
      items: [
        'to communicate with you',
        'to provide products and services to you',
        'to process and fulfil your purchases, contest entries and refunds',
        'to respond to your enquiries and complaints',
        'to keep you updated about our products, services, offers, promotions and events, and about those of selected third party partners that may be of interest to you from time to time, by SMS, phone call, email, fax, mail, social media or any other appropriate channel',
        'to process and analyse your personal data, either individually or collectively with other individuals',
        'to share your personal data with a third party where that is necessary to fulfil your purchase, order, enquiry or complaint, for example a payment gateway provider or a delivery provider',
        'to maintain and improve our customer relationships',
        'to maintain and update internal records',
        'to register a user account with Legendary',
        'for internal administrative purposes',
        'for audit and risk management purposes',
        'to detect, investigate and prevent fraudulent, prohibited or illegal activity',
        'to meet any applicable legal or regulatory requirement, and to make disclosures required by any law, regulation, direction, court order, by law, guideline, circular or code applicable to Legendary',
        'to enforce or defend the rights of Legendary and your rights, and to comply with the obligations of Legendary under applicable laws, legislation and regulations',
        'for other purposes required to operate and maintain the business of Legendary',
      ],
    },

    { t: 'h2', text: 'Who we share information with' },
    {
      t: 'p',
      text:
        'All payment data is stored by our payment gateway partners, RazerPay and PayPal, and by our delivery partners. Their privacy policies can be found on their own websites. Legendary does not and will never sell, rent or share your personal information, including your email address, with any third party for any purpose without your express permission.',
    },
    {
      t: 'p',
      text:
        'Your transaction data will be available to some extent on your account page once you have logged in. You create this in acknowledgement of this privacy policy. You must protect your own password, as Legendary is not liable for any unauthorised use of our website.',
    },
    {
      t: 'p',
      text:
        'The Legendary website automatically gathers information about how the site is used. That data is used to improve your experience and your flow through the site, and it includes the use of cookies and similar technologies.',
    },

    { t: 'h2', text: 'How we use your information' },
    {
      t: 'p',
      text:
        'Any information gathered on this site is used to improve your experience with Legendary or to fulfil your order. We will not share, sell or reveal your information unless it is already described in this Privacy Policy or required by law.',
    },
    {
      t: 'p',
      text:
        'Reputable and trusted third party vendors may be permitted to access your data in order to carry out maintenance, hosting or upgrades to the site, or other services we may require from time to time. We use a reputable courier company, which is given access to your mailing information in order to deliver your order.',
    },
    {
      t: 'p',
      text:
        'We reserve the right to disclose information in order to comply with a subpoena, court order, administrative or governmental order, or any other requirement of law, or where we believe at our sole discretion that it is necessary to protect our rights or the rights of others, to prevent harm to persons or property, or to fight fraud and reduce credit risk.',
    },
    {
      t: 'p',
      text:
        'If you provide feedback or use any of the forms on the site, the information you submit will only be used to fulfil your request.',
    },
    {
      t: 'p',
      text:
        'Anything you submit on our site or on any of our social media properties, such as Facebook, Instagram, TikTok, Spotify and Pinterest, may be displayed publicly.',
    },

    { t: 'h2', text: 'Privacy policy changes' },
    {
      t: 'p',
      text:
        'Any changes to this Privacy Policy will be posted here so that you have immediate access to the updates. Your continued use of the site indicates your assent to the Privacy Policy as posted.',
    },
    {
      t: 'p',
      text:
        `If you have any questions about this Privacy Policy, please use the form on our [contact page](/contact), or write to us at ${SUPPORT_EMAIL}.`,
    },
    {
      t: 'tip',
      text: 'Do not hesitate to contact us if you have any questions at all about our Privacy Policy.',
    },
  ],
}

export const policies: Policy[] = [shippingPolicy, returnsPolicy, termsOfService, privacyPolicy]

export function getPolicy(slug: string): Policy | undefined {
  return policies.find((p) => p.slug === slug)
}
