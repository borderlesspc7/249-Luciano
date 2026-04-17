import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function ProjectsTabRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/project-home");
  }, [router]);

  return null;
}

