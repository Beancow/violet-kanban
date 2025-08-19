import OrganizationGate from '@/components/guards/OrganizationGate';
import { Button, Flex, Container } from '@radix-ui/themes';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
    return (
        <OrganizationGate>
            <Container maxWidth='45rem'>
                <Flex
                    my='9'
                    direction='column'
                    gap='4'
                    justify='center'
                    width='100%'
                >
                    <div className={styles.hero}>
                        <h1 className={styles.title}>Violet Kanban</h1>
                        <p className={styles.subtitle}>
                            Organize your work, collaborate with your team, and
                            track progress visually.
                        </p>
                    </div>
                    <ul className={styles.featureList}>
                        <li>🟣 Fast, responsive drag-and-drop boards</li>
                        <li>🔒 Secure, private organizations and boards</li>
                        <li>📝 Real-time sync with Firebase</li>
                        <li>🎨 Customizable board colors & themes</li>
                        <li>👥 Invite and manage team members</li>
                        <li>🧪 Mock data for easy testing</li>
                    </ul>
                    <Flex justify='start' gap='4'>
                        <Button
                            size='3'
                            color='violet'
                            asChild
                            onClick={() => {
                                window.location.href = '/boards';
                            }}
                        >
                            Get Started
                        </Button>

                        <Button variant='soft' size='3' color='gray' asChild>
                            <Link href='/boards'>View Boards</Link>
                        </Button>
                        <Button variant='soft' size='3' color='gray' asChild>
                            <Link
                                href='https://github.com/Beancow/violet-kanban'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                View on GitHub
                            </Link>
                        </Button>
                    </Flex>
                </Flex>
                <footer className={styles.footer}>
                    <a
                        href='https://aviolet.dev'
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label='Avery personal site'
                    >
                        <img
                            src='/globe.svg'
                            alt="Avery's site"
                            width={20}
                            height={20}
                            className={styles.logo}
                        />
                        aviolet.dev
                    </a>
                    <a
                        href='https://github.com/Beancow/violet-kanban'
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label='Violet Kanban GitHub'
                    >
                        <img
                            src='https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
                            alt='GitHub'
                            width={20}
                            height={20}
                        />
                        GitHub
                    </a>
                </footer>
            </Container>
        </OrganizationGate>
    );
}
