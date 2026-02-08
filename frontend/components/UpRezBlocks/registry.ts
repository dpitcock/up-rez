import { Hero } from './Hero';
import { PricingCard } from './PricingCard';
import { AmenityCloud } from './AmenityCloud';
import { Container } from './Container';

export const UpRezBlocks = {
    Container: {
        component: Container,
        name: 'Container',
        schema: {
            children: { type: 'slot' }
        }
    },
    Hero: {
        component: Hero,
        name: 'Hero Section',
        schema: {
            headline: { type: 'string', default: 'Upgrade Your Stay' },
            subheadline: { type: 'string', default: 'Experience luxury living at its finest' },
            image: { type: 'string', default: '' }
        }
    },
    PricingCard: {
        component: PricingCard,
        name: 'Pricing Card',
        schema: {
            fee: { type: 'string', default: '50' },
            cta_text: { type: 'string', default: 'Upgrade Now' },
            cta_url: { type: 'string', default: '#' }
        }
    },
    AmenityCloud: {
        component: AmenityCloud,
        name: 'Amenity Cloud',
        schema: {
            items: { type: 'string', default: [] }
        }
    }
};
