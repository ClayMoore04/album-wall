import { motion } from "framer-motion";
import { useLocation, useNavigationType } from "react-router-dom";

const variants = {
  initial: (direction) => ({
    opacity: 0,
    x: direction === "POP" ? -20 : 20,
  }),
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction === "POP" ? 20 : -20,
  }),
};

export default function PageTransition({ children }) {
  const location = useLocation();
  const navType = useNavigationType();

  return (
    <motion.div
      key={location.pathname}
      custom={navType}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
