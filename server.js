// api/criar-pagamento.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    try {
        const { total } = req.body;
        
        // Converter valor para cêntimos (ex: 10.00€ -> 1000)
        const amountInCents = Math.round(parseFloat(total) * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'eur',
            payment_method_types: ['card'],
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
