When an offer is accepted in your UpRez system, trigger these automated actions: generate a unique confirmation number, create a mock payment link (Stripe Elements demo), show a success page with congrats messaging, and mark the offer as "accepted" in the DB while queuing the reservation update workflow. The offer link (/offer/{offer_id}) handles acceptance via POST, recording details server-side.

## Backend Flow (FastAPI)
```python
@app.post("/offer/{offer_id}/accept")
async def accept_offer(offer_id: str, user_ AcceptOffer):
    # 1. Validate & mark accepted
    offer = get_offer(offer_id)
    if offer.status != "active": raise HTTPException(400, "Expired")
    update_offer_status(offer_id, "accepted", accepted_at=now())
    
    # 2. Generate artifacts
    confirmation_num = generate_confirmation("UREZ-" + str(uuid.uuid4())[:8])
    payment_url = f"/pay/{offer_id}?session_id={mock_stripe_session()}"
    
    # 3. Queue real workflow (celery/email)
    queue_reservation_update(offer.booking_id, offer.top3[0].prop_id, confirmation_num)
    
    return {
        "success": True,
        "confirmation_number": confirmation_num,
        "message": "Congratulations! Processing your upgrade...",
        "payment_url": payment_url,
        "next_steps": "Complete payment to finalize."
    }
```

## Frontend Success Page (/confirmation/{confirmation_num})
Link from offers auto-redirects here post-acceptance. Pulls data via API.

```html
<!-- confirmation.html / React component -->
<div class="confetti-container">🎉</div>
<h1>Congratulations, [Guest Name]!</h1>
<p>Your upgrade to <strong>[New Property Name]</strong> has been requested.</p>

<div class="status-grid">
  <div class="card">
    <h3>Confirmation #UREZ-ABC123</h3>
    <p>Offer ID: [offer_id]</p>
  </div>
  <div class="card">
    <h3>Balance Due</h3>
    <p>€[amount]</p>
    <a href="[payment_url]" class="btn-primary">Complete Payment</a>
  </div>
</div>

<section class="timeline">
  <div class="step active">Offer Accepted ✓</div>
  <div class="step pending">Payment Processing</div>
  <div class="step pending">Reservation Updated</div>
  <div class="step pending">Check-in Email Sent</div>
</section>

<p><em>Payment receipt & new details coming to [guest_email] shortly.</em></p>
```

## Mock Payment Page (/pay/{offer_id})
Stripe Elements demo (no real charge).

```html
<h2>Secure Payment</h2>
<form id="payment-form">
  <div id="card-element"><!-- Stripe Elements --></div>
  <button type="submit">Pay €[balance] Remainder</button>
</form>
<script>
// Mock success → redirect to /confirmation
stripe.confirmCardPayment(...).then(() => {
  window.location = `/confirmation/${confirmation_num}`;
});
</script>
```

## Database Updates
```sql
-- offers table
UPDATE offers 
SET status = 'accepted', 
    accepted_at = NOW(),
    confirmation_number = 'UREZ-ABC123',
    payment_url = '/pay/5001'
WHERE offer_id = '5001';

-- Log for analytics
INSERT INTO offer_events (offer_id, event='accepted', user_agent, ip);
```

## Email Triggers (Resend)
Immediate post-acceptance:  
- Payment receipt (fake tx ID)  
- Timeline expectations (as in FAQ)

This mocks the full flow end-to-end for demos: offer link → accept → confetti success → fake pay → "processing" state → emails. Ties into your cron/cancellation triggers and historical data sims. Use Vercel for page hosting, FastAPI backend for logic.[1]
