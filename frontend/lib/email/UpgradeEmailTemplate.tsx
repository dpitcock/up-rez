import React from 'react';

interface UpgradeEmailTemplateProps {
    guestName: string;
    originalPropName: string;
    companyName: string;
    upgradeOption: {
        prop_name: string;
        images: string[];
        summary: string;
        diffs: string[];
        pricing: {
            revenue_lift: number;
            nights: number;
        };
    };
    offerUrl: string;
    expiresAt: string;
    aiContent?: {
        title?: string;
        content?: string;
        selling_points?: string[];
        cta_text?: string;
    };
}

export const UpgradeEmailTemplate = ({
    guestName,
    originalPropName,
    companyName,
    upgradeOption,
    offerUrl,
    expiresAt,
    aiContent
}: UpgradeEmailTemplateProps) => {
    const upgradePerNight = Math.round(upgradeOption.pricing.revenue_lift / upgradeOption.pricing.nights);
    const mainImage = upgradeOption.images[0];

    // Fallbacks
    const title = aiContent?.title || `Great news, ${guestName}!`;
    const content = aiContent?.content || `We have a special upgrade opportunity for your upcoming stay at ${originalPropName}.`;
    const sellingPoints = aiContent?.selling_points || upgradeOption.diffs;
    const ctaText = aiContent?.cta_text || 'VIEW MY UPGRADE OFFER';

    const styles = {
        container: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            maxWidth: '600px',
            margin: '0 auto',
            padding: '40px 20px',
            color: '#1a1a1a',
            backgroundColor: '#ffffff',
        },
        header: {
            color: '#EF6C00',
            fontSize: '32px',
            fontWeight: '900',
            fontStyle: 'italic',
            textTransform: 'uppercase' as const,
            letterSpacing: '-1px',
            margin: '0 0 10px 0',
            lineHeight: '1.1',
        },
        company: {
            fontSize: '14px',
            color: '#666',
            fontStyle: 'italic',
            margin: '0 0 30px 0',
        },
        card: {
            backgroundColor: '#fffcf9',
            borderRadius: '24px',
            padding: '30px',
            border: '1px solid #ffe8d1',
            marginBottom: '30px',
        },
        image: {
            width: '100%',
            aspectRatio: '16/9',
            objectFit: 'cover' as const,
            borderRadius: '16px',
            marginBottom: '20px',
        },
        propName: {
            fontSize: '24px',
            fontWeight: '800',
            margin: '0 0 10px 0',
            color: '#000',
        },
        summary: {
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#444',
            margin: '0 0 20px 0',
        },
        list: {
            margin: '0 0 25px 0',
            paddingLeft: '20px',
            color: '#555',
        },
        listItem: {
            marginBottom: '8px',
            fontSize: '15px',
        },
        pricingContainer: {
            marginTop: '25px',
            paddingTop: '20px',
            borderTop: '1px solid #ffe8d1',
            display: 'table',
            width: '100%',
        },
        priceLabel: {
            display: 'table-cell',
            verticalAlign: 'middle',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#666',
        },
        priceValue: {
            display: 'table-cell',
            textAlign: 'right' as const,
            fontSize: '24px',
            fontWeight: '900',
            color: '#EF6C00',
        },
        totalLabel: {
            fontSize: '12px',
            color: '#999',
            fontWeight: 'normal' as const,
        },
        cta: {
            display: 'block',
            backgroundColor: '#EF6C00',
            color: '#ffffff',
            padding: '20px',
            textAlign: 'center' as const,
            textDecoration: 'none',
            borderRadius: '16px',
            fontWeight: '900',
            fontSize: '16px',
            letterSpacing: '1px',
            boxShadow: '0 10px 20px -5px rgba(239, 108, 0, 0.3)',
        },
        footer: {
            textAlign: 'center' as const,
            marginTop: '40px',
            paddingTop: '30px',
            borderTop: '1px solid #f0f0f0',
            fontSize: '12px',
            color: '#999',
            lineHeight: '1.5',
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>{title}</h1>
            <p style={styles.company}>— {companyName}</p>

            <p style={styles.summary}>{content}</p>

            <div style={styles.card}>
                {mainImage && (
                    <img src={mainImage} alt={upgradeOption.prop_name} style={styles.image} />
                )}
                <h2 style={styles.propName}>{upgradeOption.prop_name}</h2>

                <ul style={styles.list}>
                    {sellingPoints.map((point, i) => (
                        <li key={i} style={styles.listItem}>{point}</li>
                    ))}
                </ul>

                <div style={styles.pricingContainer}>
                    <div style={styles.priceLabel}>Upgrade Fee:</div>
                    <div style={styles.priceValue}>
                        €{upgradePerNight}/night
                        <div style={styles.totalLabel}>
                            (€{upgradeOption.pricing.revenue_lift.toFixed(0)} total for {upgradeOption.pricing.nights} nights)
                        </div>
                    </div>
                </div>
            </div>

            <a href={offerUrl} style={styles.cta}>
                {ctaText.toUpperCase()}
            </a>

            <div style={styles.footer}>
                <p>
                    Exclusive invitation expires on <strong>{expiresAt}</strong>.<br />
                    After this window closes, your original reservation at {originalPropName} will remain confirmed.
                </p>
                <p style={{ marginTop: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    Sent via UpRez AI Orchestrator
                </p>
            </div>
        </div>
    );
};
