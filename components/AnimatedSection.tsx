"use client";

import { motion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  className?: string;
};


export default function AnimatedSection({
  children,
  className = "",
}: Props) {


  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 40,
      }}

      whileInView={{
        opacity: 1,
        y: 0,
      }}

      viewport={{
        once: true,
        amount: 0.2,
      }}

      transition={{
        duration: 0.7,
        ease: "easeOut",
      }}

      className={className}

    >

      {children}

    </motion.div>

  );

}