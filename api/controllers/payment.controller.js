import axios from 'axios';
import Payment from '../models/payment.model.js';
import Listing from '../models/listing.model.js';

let token; // Declare token globally

// Function to generate the access token
const createToken = async () => {
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const consumer = process.env.MPESA_CONSUMER_KEY;
  const auth = Buffer.from(`${consumer}:${secret}`).toString("base64");

  try {
    const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      headers: {
        authorization: `Basic ${auth}`,
      },
    });
    token = response.data.access_token;
    console.log("Token generated:", token);
  } catch (err) {
    console.log("Failed to generate token", err);
    throw new Error("Failed to generate token");
  }
};

export const initiatePayment = async (req, res) => {
  const { listingId, phoneNumber, userId } = req.body;

  try {
    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const amount = listing.offer ? listing.discountPrice : listing.regularPrice;

    const newPayment = new Payment({
      user: userId,
      listing: listingId,
      amount,
      status: 'Pending',
      mpesaReceiptNumber: '',
      checkoutRequestId: '',
    });

    await newPayment.save();

    // Generate the access token
    await createToken();

    const shortCode = process.env.BUSINESS_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(shortCode + passkey + timestamp).toString('base64');

    const mpesaResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: `254${phoneNumber.substring(1)}`, // Remove leading 0 and add 254
        PartyB: shortCode,
        PhoneNumber: `254${phoneNumber.substring(1)}`,
        CallBackURL: `https://a85f-197-237-135-141.ngrok-free.app/api/payment/callback`,    
        AccountReference: `Rstate Property Purchase for ${listingId}`,
        TransactionDesc: `Payment for ${listing.name}`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    //  Update payment with checkoutRequestId
    newPayment.checkoutRequestId = mpesaResponse.data.CheckoutRequestID;
    await newPayment.save();

    res.status(200).json({
      message: 'Payment initiated',
      paymentId: newPayment._id,
      mpesaResponse: mpesaResponse.data,
    });
  } catch (error) {
    console.log("Failed to initiate payment", error);
    res.status(500).json({ message: 'Failed to initiate payment', error: error.message });
  }
};

export const handleMpesaCallback = async (req, res) => {
  console.log("Callback handler invoked");
  const { Body } = req.body;

  // Log the entire callback payload for debugging
  console.log("Received M-Pesa Callback:", JSON.stringify(Body, null, 2));

  try {
    const payment = await Payment.findOne({
      checkoutRequestId: Body.stkCallback.CheckoutRequestID,
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (Body.stkCallback.ResultCode === 0) {
      payment.status = 'Completed';
      payment.mpesaReceiptNumber = Body.stkCallback.MpesaReceiptNumber;
    } else {
      payment.status = 'Failed';
    }

    await payment.save();

    res.status(200).json({ message: 'Payment status updated' });
  } catch (error) {
    console.log("Failed to update payment status", error);
    res.status(500).json({ message: 'Failed to update payment status', error: error.message });
  }
};


export const getPaymentStatus = async (req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await Payment.findById(paymentId).populate('listing').populate('user');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.log("Failed to get payment status", error);
    res.status(500).json({ message: 'Failed to get payment status', error: error.message });
  }
};