'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FloatingCardProps {
    children: ReactNode;
    delay?: number;
}

export default function FloatingCard({ children, delay = 0 }: FloatingCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay }}
            whileHover={{ scale: 1.05, y: -10 }}
            className="relative"
        >
            {children}
        </motion.div>
    );
}
