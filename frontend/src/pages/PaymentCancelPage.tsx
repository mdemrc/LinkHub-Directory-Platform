import { Link } from 'react-router-dom'
import { FiXCircle, FiHome, FiHelpCircle, FiRotateCcw } from 'react-icons/fi'
import SEO from '../components/SEO'

export default function PaymentCancelPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <SEO title="Payment Cancelled" noindex={true} />
      <div className="bg-lz-bg-light border border-lz-border rounded-xl p-8 text-center">
        {/* Cancel Icon */}
        <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
          <FiXCircle className="text-yellow-400" size={40} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Payment Cancelled
        </h1>
        
        <p className="text-lz-text-muted mb-8">
          Your payment was cancelled and no charges were made.
        </p>

        {/* Info Box */}
        <div className="bg-lz-dark rounded-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-white mb-4">What happened?</h3>
          <p className="text-lz-text-muted mb-4">
            The payment process was cancelled. This could have happened because:
          </p>
          <ul className="space-y-2 text-sm text-lz-text-muted">
            <li className="flex items-start gap-2">
              <span className="text-lz-accent">•</span>
              You clicked the cancel button on the payment page
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lz-accent">•</span>
              The payment session timed out
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lz-accent">•</span>
              There was an issue with the payment provider
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/advertising"
            className="inline-flex items-center gap-2 px-6 py-3 bg-lz-accent text-white rounded-lg hover:bg-lz-accent/80 transition-colors"
          >
            <FiRotateCcw size={18} />
            Try Again
          </Link>
          
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-lz-bg-light border border-lz-border text-white rounded-lg hover:border-lz-accent transition-colors"
          >
            <FiHome size={18} />
            Return Home
          </Link>
        </div>

        {/* Help Link */}
        <div className="mt-8 pt-6 border-t border-lz-border">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-lz-text-muted hover:text-lz-accent transition-colors"
          >
            <FiHelpCircle size={16} />
            Need help? Contact us
          </Link>
        </div>
      </div>
    </div>
  )
}
