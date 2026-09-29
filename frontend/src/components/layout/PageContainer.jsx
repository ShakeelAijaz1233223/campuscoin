import { motion } from 'framer-motion';
import { itemVariants, containerVariants } from '../../motion/variants';

export default function PageContainer({
  eyebrow,
  title,
  description,
  actions,
  children
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-enter"
    >
      <motion.div variants={itemVariants} className="page-heading">
        <div>
          {eyebrow && <p className="eyebrow nova-eyebrow">{eyebrow}</p>}
          {title && <h1>{title}</h1>}
          {description && <p className="muted">{description}</p>}
        </div>
        {actions && (
          <div className="row wrap">
            <motion.div
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.22, duration: 0.45 }}
              className="row wrap"
            >
              {actions}
            </motion.div>
          </div>
        )}
      </motion.div>
      {children}
    </motion.div>
  );
}
