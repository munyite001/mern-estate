import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore from 'swiper';
import { useSelector } from 'react-redux';
import { Navigation } from 'swiper/modules';
import axios from 'axios';
import 'swiper/css/bundle';
import { useRef } from 'react';
import {useReactToPrint} from 'react-to-print';
import PaymentDetails from '../components/paymentDetails';

import {
  FaBath, FaBed, FaChair, FaMapMarkerAlt, FaParking, FaShare,
} from 'react-icons/fa';
import Contact from '../components/Contact';
import { set } from 'mongoose';

export default function Listing() {
  SwiperCore.use([Navigation]);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const params = useParams();
  const { currentUser } = useSelector((state) => state.user);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const componentRef = useRef();


  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  useEffect(() => {
    // If the modal is shown, disable scrolling on the body
    if (showSuccessModal) {
      document.body.style.overflowY = 'hidden';
    } else {
      // Re-enable scrolling when the modal is not shown
      document.body.style.overflowY = 'auto';
    }

    // Cleanup function to ensure the body style is reset when the component unmounts
    return () => {
      document.body.style.overflowY = 'auto';
    };
  }, [showSuccessModal]);


  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/listing/get/${params.listingId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(true);
          setLoading(false);
          return;
        }
        setListing(data);
        setLoading(false);
        setError(false);
      } catch (error) {
        setError(true);
        setLoading(false);
      }
    };
    fetchListing();
  }, [params.listingId]);

  const handlePayment = async () => {
    try {
      setPaying(true);
      const response = await axios.post('/api/payment/pay', {
        userId: currentUser._id,
        listingId: listing._id,
        phoneNumber: currentUser.phone, // Assuming phoneNumber is part of the user data
      });

      console.log("Response sent back to the client", response.data);

      if (response.data["mpesaResponse"].ResponseCode === '0') {
        const paymentId = response.data.paymentId
        alert('Payment initiated. Please complete the payment on your phone.');

        //  Poll for payment status
        const intervalId = setInterval(async () => {
          try {
            const statusResponse = await axios.get(`/api/payment/status/${paymentId}`);
            const payment = statusResponse.data;

            if (payment.status === 'Completed') {
              setShowSuccessModal(true);
              setPaying(false);
              setPaymentSuccess(true);
              clearInterval(intervalId);
              setPaymentDetails(payment);
              alert('Payment successful! Thank you for your purchase.');
            } else if (payment.status === 'Failed') {
              setPaying(false);
              clearInterval(intervalId);
              alert('Payment failed. Please try again.');
            }
          } catch(err) {
            console.log('Error fetching payment status', error);
          }
        }, 5000)
      } else {
        setPaying(false);
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      setPaying(false);
      alert(`Payment failed. Please try again. ${error}`);
    }
  };

  return (
    <main>
      {showSuccessModal && (
        <div className='SuccessModal fixed inset-0 w-full h-screen	z-50 grid place-items-center	' style={{background: "rgba(0,0,0,0.8)"}}>
          <div className='SuccessModal__content bg-white p-5 rounded'>
            <img src="/icon-order-confirmed.svg" alt="Order Confirmed" className='my-3 mx-auto'/>
            <h1 className='text-3xl font-semibold text-center'>Payment successful!</h1>
            <p className='text-center my-3'>Thank you for your purchase.</p>
            <button className="w-20 h-10 bg-red-800 text-slate-50 rounded-xl my-2 ml-10" onClick={() => setShowSuccessModal(false)}>Close</button>
            <button className="w-20 h-10 bg-green-800 text-slate-50 rounded-xl my-2 ml-5" onClick={handlePrint}>Print</button>
        </div>
      </div>
      )}
      {paymentSuccess && paymentDetails && (
      <PaymentDetails paymentDetails={paymentDetails} ref={componentRef}/>
    )}
      {loading && <p className="text-center my-7 text-2xl">Loading...</p>}
      {error && (
        <p className="text-center my-7 text-2xl">Something went wrong!</p>
      )}
      {listing && !loading && !error && (
        <div>
          <Swiper navigation>
            {listing.imageUrls.map((url) => (
              <SwiperSlide key={url}>
                <div
                  className="h-[550px]"
                  style={{
                    background: `url(${url}) center no-repeat`,
                    backgroundSize: 'cover',
                  }}
                ></div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="fixed top-[13%] right-[3%] z-10 border rounded-full w-12 h-12 flex justify-center items-center bg-slate-100 cursor-pointer">
            <FaShare
              className="text-slate-500"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 2000);
              }}
            />
          </div>
          {copied && (
            <p className="fixed top-[23%] right-[5%] z-10 rounded-md bg-slate-100 p-2">
              Link copied!
            </p>
          )}
          <div className="flex flex-col max-w-4xl mx-auto p-3 my-7 gap-4">
            <p className="text-2xl font-semibold">
              {listing.name} - Kes{' '}
              {listing.offer
                ? listing.discountPrice.toLocaleString('en-US')
                : listing.regularPrice.toLocaleString('en-US')}
              {listing.type === 'rent' && ' / month'}
            </p>
            <p className="flex items-center mt-6 gap-2 text-slate-600  text-sm">
              <FaMapMarkerAlt className="text-green-700" />
              {listing.address}
            </p>
            <div className="flex gap-4">
              <p className="bg-red-900 w-full max-w-[200px] text-white text-center p-1 rounded-md">
                {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
              </p>
              {listing.offer && (
                <p className="bg-green-900 w-full max-w-[200px] text-white text-center p-1 rounded-md">
                  {+listing.regularPrice - +listing.discountPrice} OFF
                </p>
              )}
            </div>
            <p className="text-slate-800">
              <span className="font-semibold text-black">Description - </span>
              {listing.description}
            </p>
            <ul className="text-green-900 font-semibold text-sm flex flex-wrap items-center gap-4 sm:gap-6">
              <li className="flex items-center gap-1 whitespace-nowrap ">
                <FaBed className="text-lg" />
                {listing.bedrooms > 1
                  ? `${listing.bedrooms} beds `
                  : `${listing.bedrooms} bed `}
              </li>
              <li className="flex items-center gap-1 whitespace-nowrap ">
                <FaBath className="text-lg" />
                {listing.bathrooms > 1
                  ? `${listing.bathrooms} baths `
                  : `${listing.bathrooms} bath `}
              </li>
              <li className="flex items-center gap-1 whitespace-nowrap ">
                <FaParking className="text-lg" />
                {listing.parking ? 'Parking spot' : 'No Parking'}
              </li>
              <li className="flex items-center gap-1 whitespace-nowrap ">
                <FaChair className="text-lg" />
                {listing.furnished ? 'Furnished' : 'Unfurnished'}
              </li>
            </ul>
            {currentUser && listing.userRef !== currentUser._id && !contact && (
              <button
                onClick={() => setContact(true)}
                className="bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 p-3"
              >
                Contact landlord
              </button>
            )}
            {contact && <Contact listing={listing} />}

            {/* Payment Button */}
            {currentUser && listing.userRef !== currentUser._id && (
              <button
                onClick={handlePayment}
                className="bg-green-700 text-white rounded-lg uppercase hover:opacity-95 p-3 mt-4"
                disabled={paying}
              >
                {paying ? 'Processing Payment...' : 'Pay via M-Pesa'}
              </button>
            )}
            {paymentSuccess && (
              <p className="text-green-700 mt-4">
                Payment successful! Thank you for your purchase.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
