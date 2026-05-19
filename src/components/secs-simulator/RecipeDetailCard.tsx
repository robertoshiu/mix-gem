'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

import type { DemoSecsMessage } from '@/lib/secs-gem-demo-data';
import type { Recipe } from '@/lib/mes-types';
import { cn } from '@/lib/utils';
import { recipeRollUp, useReducedMotion } from '@/lib/secs-simulator-animation';

type RecipeDetailCardProps = {
  recipe: Recipe | null;
  isVisible: boolean;
  messageS2F49?: DemoSecsMessage;
  messageS2F50?: DemoSecsMessage;
};

function RecipeDetailContent({
  recipe,
  messageS2F49,
  messageS2F50,
}: { recipe: Recipe } & Pick<RecipeDetailCardProps, 'messageS2F49' | 'messageS2F50'>) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 shadow-sm',
        'bg-[var(--sf-surface-panel)] text-[var(--sf-text-primary)]',
        'border-[var(--sf-accent-violet)]'
      )}
      style={{
        backgroundColor: 'var(--sf-surface-panel)',
        borderColor: 'var(--sf-accent-violet)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: 'rgba(139, 92, 246, 0.16)',
            color: 'var(--sf-accent-violet)',
          }}
        >
          <BookOpen className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">Recipe pushed</h3>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.16)',
                color: 'var(--sf-accent-violet)',
              }}
            >
              S2F49
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--sf-text-muted)]">Recipe ID</dt>
              <dd className="font-medium">{recipe.id}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--sf-text-muted)]">Name</dt>
              <dd className="font-medium">{recipe.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--sf-text-muted)]">Process</dt>
              <dd className="font-medium">{recipe.process}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--sf-text-muted)]">Chamber</dt>
              <dd className="font-medium">{recipe.chamber}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--sf-text-muted)]">Exposure</dt>
              <dd className="font-medium">{recipe.exposure} mJ/cm²</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--sf-text-muted)]">Focus</dt>
              <dd className="font-medium">{recipe.focus} nm offset</dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {messageS2F49 ? (
              <span
                className="rounded-md px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(59,130,246,0.16)',
                  color: 'var(--sf-accent-blue)',
                }}
              >
                → {messageS2F49.summary}
              </span>
            ) : null}

            {messageS2F50 ? (
              <span
                className="rounded-md px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(20,184,166,0.16)',
                  color: 'var(--sf-accent-teal)',
                }}
              >
                ← {messageS2F50.summary}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecipeDetailCard({
  recipe,
  isVisible,
  messageS2F49,
  messageS2F50,
}: RecipeDetailCardProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return recipe && isVisible ? (
      <RecipeDetailContent recipe={recipe} messageS2F49={messageS2F49} messageS2F50={messageS2F50} />
    ) : null;
  }

  return (
    <AnimatePresence mode="wait">
      {recipe && isVisible ? (
        <motion.div
          key={recipe.id}
          variants={recipeRollUp}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <RecipeDetailContent recipe={recipe} messageS2F49={messageS2F49} messageS2F50={messageS2F50} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default RecipeDetailCard;
