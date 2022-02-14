import asyncHandler from 'express-async-handler'
import Order from '../models/orderModel.js'
import Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'
const stripe = Stripe(
  'sk_test_51K8gdwLv5rAyPDp0EkX3MKQC2NLSLQLkoLyGwD6m0XTPqvXY4vhQz1dH8CKqyd9Q3N3gvbiFurW7VCthruw3gPgW007YxLRO3B'
)

// @desc create new order
// @route POST /api/orders
// @access Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body
  if (orderItems && orderItems.length === 0) {
    res.status(400)
    throw new Error('No order items')
  } else {
    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      taxPrice,
      shippingPrice,
      totalPrice,
    })
    const createdOrder = await order.save()
    res.status(201).json(createdOrder)
  }
})

// @desc Get order by ID
// @route GET /api/orders/:id
// @access Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  )
  if (order) {
    res.json(order)
  } else {
    res.status(404)
    throw new Error('Order not found')
  }
})

// @desc    Update order to paid
// @route   GET /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  const { stripeToken, totalPrice } = req.body

  const customer = await stripe.customers.create({
    email: stripeToken.email,
    source: stripeToken.id,
  })

  const payment = await stripe.charges.create(
    {
      amount: totalPrice * 100,
      currency: 'USD',
      customer: customer.id,
      receipt_email: stripeToken.email,
    },
    {
      idempotencyKey: uuidv4(),
    }
  )

  if (payment) {
    order.isPaid = true
    order.paidAt = Date.now()
    order.paymentResult = {
      id: payment.source.id,
      street: stripeToken.card.address_line1,
      city: stripeToken.card.address_city,
      country: stripeToken.card.address_country,
      pincode: stripeToken.card.address_zip,
      paid: payment.paid,
    }

    const updatedOrder = await order.save()

    res.json(updatedOrder)
  } else {
    res.status(404)
    throw new Error('Order not found')
  }
})

// @desc    Update order to delivered
// @route   GET /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (order) {
    order.isDelivered = true
    order.deliveredAt = Date.now()

    const updatedOrder = await order.save()

    res.json(updatedOrder)
  } else {
    res.status(404)
    throw new Error('Order not found')
  }
})
// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
  res.json(orders)
})

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name')
  res.json(orders)
})
export {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
}

//  id: 'ch_3KT18FLv5rAyPDp011ynf8hS',
//   object: 'charge',
//   amount: 68999,
//   amount_captured: 68999,
//   amount_refunded: 0,
//   application: null,
//   application_fee: null,
//   application_fee_amount: null,
//   balance_transaction: 'txn_3KT18FLv5rAyPDp01VlqOUQM',
//   billing_details: {
//     address: {
//       city: 'Inventore eaque null',
//       country: 'Antigua and Barbuda',
//       line1: 'Quibusdam reiciendis',
//       line2: null,
//       postal_code: '+1 (487) 486-5847',
//       state: null
//     },
//     email: null,
//     name: 'Clark Wilkerson',
//     phone: null
//   },
//   calculated_statement_descriptor: 'Stripe',
//   captured: true,
//   created: 1644831967,
//   currency: 'usd',
//   customer: 'cus_L9JlNGESjojIh2',
//   description: null,
//   destination: null,
//   dispute: null,
//   disputed: false,
//   failure_code: null,
//   failure_message: null,
//   fraud_details: {},
//   invoice: null,
//   livemode: false,
//   metadata: {},
//   on_behalf_of: null,
//   order: null,
//   outcome: {
//     network_status: 'approved_by_network',
//     reason: null,
//     risk_level: 'normal',
//     risk_score: 26,
//     seller_message: 'Payment complete.',
//     type: 'authorized'
//   },
//   paid: true,
//   payment_intent: null,
//   payment_method: 'card_1KT189Lv5rAyPDp0tA5xQrkS',
//   payment_method_details: {
//     card: {
//       brand: 'visa',
//       checks: [Object],
//       country: 'US',
//       exp_month: 3,
//       exp_year: 2022,
//       fingerprint: 'xnPOo5Pl3DjvTt8Z',
//       funding: 'credit',
//       installments: null,
//       last4: '4242',
//       network: 'visa',
//       three_d_secure: null,
//       wallet: null
//     },
//     type: 'card'
//   },
//   receipt_email: 'cosiqag@mailinator.com',
//   receipt_number: null,
//   receipt_url: 'https://pay.stripe.com/receipts/acct_1K8gdwLv5rAyPDp0/ch_3KT18FLv5rAyPDp011ynf8hS/rcpt_L9JlTD4lLtVp44raNqgUGM7YyEVlZte',
//   refunded: false,
//   refunds: {
//     object: 'list',
//     data: [],
//     has_more: false,
//     total_count: 0,
//     url: '/v1/charges/ch_3KT18FLv5rAyPDp011ynf8hS/refunds'
//   },
//   review: null,
//   shipping: null,
//   source: {
//     id: 'card_1KT189Lv5rAyPDp0tA5xQrkS',
//     object: 'card',
//     address_city: 'Inventore eaque null',
//     address_country: 'Antigua and Barbuda',
//     address_line1: 'Quibusdam reiciendis',
//     address_line1_check: 'pass',
//     address_line2: null,
//     address_state: null,
//     address_zip: '+1 (487) 486-5847',
//     address_zip_check: 'pass',
//     brand: 'Visa',
//     country: 'US',
//     customer: 'cus_L9JlNGESjojIh2',
//     cvc_check: 'pass',
//     dynamic_last4: null,
//     exp_month: 3,
//     exp_year: 2022,
//     fingerprint: 'xnPOo5Pl3DjvTt8Z',
//     funding: 'credit',
//     last4: '4242',
//     metadata: {},
//     name: 'Clark Wilkerson',
//     tokenization_method: null
//   },
//   source_transfer: null,
//   statement_descriptor: null,
//   statement_descriptor_suffix: null,
//   status: 'succeeded',
//   transfer_data: null,
//   transfer_group: null
