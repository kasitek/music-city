import { useLocation, useNavigate } from "react-router-dom";

export const useRouter = () => {
  const navigate = useNavigate();

  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    prefetch: async (_href: string) => {},
  };
};

export const usePathname = () => {
  const location = useLocation();
  return location.pathname;
};
