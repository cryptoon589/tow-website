import { motion } from 'framer-motion';
import { ACTIONS } from '../game/content';

interface ActionButtonsProps {
  actions: string[];
  onActionSelect: (actionId: string) => void;
  disabled?: boolean;
}

export function ActionButtons({
  actions,
  onActionSelect,
  disabled = false,
}: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {actions.map((actionId) => {
        const action = ACTIONS.find((a) => a.id === actionId);
        if (!action) return null;

        const style = getActionStyle(actionId);

        return (
          <motion.button
            key={actionId}
            onClick={() => onActionSelect(actionId)}
            disabled={disabled}
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`
              group
              relative
              rounded-xl
              px-4 py-4
              text-left
              border
              transition-all duration-200
              ${style.base}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {/* subtle hover glow */}
            <div
              className={`
                absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200
                ${style.hover}
              `}
            />

            <div className="relative z-10">
              <div className="text-sm font-semibold text-[#1E1B18]">
                {action.name}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function getActionStyle(actionId: string) {
  switch (actionId) {
    case 'buy_dip':
      return {
        base: `
          bg-[#F3FAF6] border-[#D7EBDD]
        `,
        hover: `bg-[#E8F7EF]`,
      };

    case 'check_portfolio':
      return {
        base: `
          bg-[#F2F4F7] border-[#DADFE6]
        `,
        hover: `bg-[#E8EDF3]`,
      };

    case 'sleep':
      return {
        base: `
          bg-[#F5F2F7] border-[#E2DBE8]
        `,
        hover: `bg-[#EEE7F3]`,
      };

    case 'touch_grass':
      return {
        base: `
          bg-[#F4FAF2] border-[#DCEAD7]
        `,
        hover: `bg-[#EAF6E5]`,
      };

    case 'ape_coin':
      return {
        base: `
          bg-[#F9F3FF] border-[#E5DAFF]
        `,
        hover: `bg-[#F2E9FF]`,
      };

    case 'influencer':
      return {
        base: `
          bg-[#FFF6EB] border-[#F1E0C7]
        `,
        hover: `bg-[#FFEED8]`,
      };

    case 'telegram':
      return {
        base: `
          bg-[#F3F3FA] border-[#E1E1EF]
        `,
        hover: `bg-[#E9E9F7]`,
      };

    default:
      return {
        base: `
          bg-[#FFFCF8] border-[#DDD7CE]
        `,
        hover: `bg-[#F6F1EA]`,
      };
  }
}